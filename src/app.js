import { Hono } from "hono";
import ejs from "ejs";
import { createNodeWebSocket } from "@hono/node-ws";
import {
  addBird,
  authenticateUser,
  createUser,
  deleteBird,
  getAllBirds,
  getAllBirdsWithUsers,
  getBirdById,
  getUserByToken,
  getUserStats,
  toggleBird,
  updateBird,
  updateUserAvatar,
} from "./db.js";

import { getCookie, setCookie } from "hono/cookie";

import fs from "fs/promises";

import { serveStatic } from "@hono/node-server/serve-static";
const app = new Hono();
app.use("/public/*", serveStatic({ root: "./" }));
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use(async (c, next) => {
  const token = getCookie(c, "token");
  c.set("user", token ? await getUserByToken(token) : null);
  await next();
});

const auth = async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.redirect("/login");
  }
  await next();
};

// Homepage
app.get("/", auth, async (c) => {
  const user = c.get("user");
  const filters = {
    seen: c.req.query("seen"),
    family: c.req.query("family"),
    order: c.req.query("order"),
  };
  const birds = await getAllBirds(user.id, filters);

  // pro selecty načteme všechny ptáky bez filtru
  const allBirds = await getAllBirds(user.id, {});
  const families = [...new Set(allBirds.map((b) => b.family).filter(Boolean))];
  const orders = [...new Set(allBirds.map((b) => b.order).filter(Boolean))];

  const index = await ejs.renderFile(
    "src/views/index.ejs",
    { title: "Birds", birds, user, filters, families, orders },
    { views: ["src/views"] },
  );
  return c.html(index);
});
//community
app.get("/community", auth, async (c) => {
  const user = c.get("user");
  const filters = {
    seen: c.req.query("seen"),
    family: c.req.query("family"),
    order: c.req.query("order"),
  };
  const birds = await getAllBirdsWithUsers(filters);

  const allBirds = await getAllBirdsWithUsers({});
  const families = [...new Set(allBirds.map((b) => b.family).filter(Boolean))];
  const orders = [...new Set(allBirds.map((b) => b.order).filter(Boolean))];

  const community = await ejs.renderFile(
    "src/views/community.ejs",
    { title: "Birds", birds, user, filters, families, orders },
    { views: ["src/views"] },
  );
  return c.html(community);
});

let webSockets = new Set();

app.get(
  "/ws",
  upgradeWebSocket((c) => ({
    onOpen: (evt, ws) => {
      webSockets.add(ws);
      console.log("Nové spojení, celkem:", webSockets.size);
    },
    onClose: (evt, ws) => {
      webSockets.delete(ws);
      console.log("Spojení ukončeno");
    },
  })),
);

const sendBirdsToAllWebsockets = async () => {
  try {
    const birds = await getAllBirdsWithUsers();
    const html = await ejs.renderFile(
      "src/views/_community_birds.ejs",
      { birds },
      { views: ["src/views"] },
    );
    for (const webSocket of webSockets) {
      webSocket.send(JSON.stringify({ type: "birds", html }));
    }
  } catch (e) {
    console.error(e);
  }
};

app.get("/profile", auth, async (c) => {
  const user = c.get("user");
  const stats = await getUserStats(user.id);

  const profile = await ejs.renderFile(
    "src/views/profile.ejs",
    { title: "Profile", user, stats },
    { views: ["src/views"] },
  );
  return c.html(profile);
});

// pridavani ptaku
app.post("/add-bird", auth, async (c) => {
  const body = await c.req.parseBody();

  const file = body["image"];
  const audioFile = body["audio"];
  let imageURL = null;
  let audioURL = null;

  if (file && file.size > 0) {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `public/uploads/birds/${fileName}`;
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    imageURL = filePath;
  }

  if (audioFile && audioFile.size > 0) {
    const audioFileName = `${Date.now()}_${audioFile.name}`;
    const audioFilePath = `public/uploads/audio/${audioFileName}`;
    const audioArrayBuffer = await audioFile.arrayBuffer();
    await fs.writeFile(audioFilePath, Buffer.from(audioArrayBuffer));
    audioURL = audioFilePath;
  }

  await addBird({
    name: body["name"],
    latinName: body["latinName"],
    order: body["order"],
    family: body["family"],
    date: body["date"],
    gender: body["gender"] === "true",
    notes: body["notes"],
    count: body["count"],
    seen: body["seen"] === "true",
    lat: body["lat"],
    lng: body["lng"],
    imageURL,
    audioURL,
    userId: c.get("user").id,
  });
  sendBirdsToAllWebsockets();
  return c.redirect("/");
});

// mazani ptaku
app.post("/remove-bird/:id", auth, async (c) => {
  const id = Number(c.req.param("id"));
  const user = c.get("user");
  const bird = await getBirdById(id);
  if (!bird) return c.notFound();
  if (bird.userId !== user.id) return c.redirect("/");

  await deleteBird(id);
  return c.redirect("/");
});

// zmena stavu
app.post("/toggle-bird/:id", auth, async (c) => {
  const id = Number(c.req.param("id"));
  const user = c.get("user");
  const bird = await getBirdById(id);
  if (!bird) return c.notFound();
  if (bird.userId !== user.id) return c.redirect("/");

  await toggleBird(id);
  sendBirdsToAllWebsockets();
  return c.redirect("/");
});

// open edit
app.get("/open-edit/:id", auth, async (c) => {
  const id = Number(c.req.param("id"));
  const user = c.get("user");
  const bird = await getBirdById(id);
  if (!bird) return c.notFound();

  const isOwner = bird.userId === user.id;

  const edit = await ejs.renderFile(
    "src/views/edit.ejs",
    { title: "Edit " + bird.name, bird, user, isOwner },
    { views: ["src/views"] },
  );
  return c.html(edit);
});

// save changes
app.post("/save-changes/:id", auth, async (c) => {
  const body = await c.req.parseBody();
  const id = Number(c.req.param("id"));
  const user = c.get("user");

  const file = body["image"];
  const audioFile = body["audio"];
  let imageURL = null;
  let audioURL = null;
  const bird = await getBirdById(id);

  if (!bird) return c.notFound();
  if (bird.userId !== user.id) return c.redirect("/community");

  if (file && file.size > 0) {
    // smaž starý jen když nahrávám nový
    if (bird.imageURL) {
      await fs.unlink(bird.imageURL).catch(() => {});
    }
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `public/uploads/birds/${fileName}`;
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    imageURL = filePath;
  }

  if (audioFile && audioFile.size > 0) {
    // smaž starý jen když nahrávám nový
    if (bird.audioURL) {
      await fs.unlink(bird.audioURL).catch(() => {});
    }
    const audioFileName = `${Date.now()}_${audioFile.name}`;
    const audioFilePath = `public/uploads/audio/${audioFileName}`;
    const audioArrayBuffer = await audioFile.arrayBuffer();
    await fs.writeFile(audioFilePath, Buffer.from(audioArrayBuffer));
    audioURL = audioFilePath;
  }

  await updateBird(id, {
    name: body["name"],
    latinName: body["latinName"],
    order: body["order"],
    family: body["family"],
    date: body["date"],
    gender: body["gender"] === "true",
    notes: body["notes"],
    count: body["count"],
    seen: body["seen"] === "true",
    ...(imageURL && { imageURL }),
    ...(audioURL && { audioURL }),
  });
  sendBirdsToAllWebsockets();
  return c.redirect(`/open-edit/${id}`);
});

// uzivatele
app.get("/register", async (c) => {
  const error = c.req.query("error");
  const register = await ejs.renderFile(
    "src/views/register.ejs",
    { error },
    { views: ["src/views"] },
  );
  return c.html(register);
});

app.get("/login", async (c) => {
  const error = c.req.query("error");
  const login = await ejs.renderFile(
    "src/views/login.ejs",
    { error },
    { views: ["src/views"] },
  );
  return c.html(login);
});

app.post("/create-user", async (c) => {
  const body = await c.req.formData();
  const userName = body.get("userName");
  const password = body.get("passWord");

  const passwordConfirm = body.get("passWordConfirm");

  if (password !== passwordConfirm) {
    return c.redirect("/register?error=passwords");
  }
  const result = await createUser(userName, password);
  if (!result) {
    return c.redirect("/register?error=exists");
  }

  return c.redirect("/");
});

app.post("/login-user", async (c) => {
  const body = await c.req.formData();
  const userName = body.get("userName");
  const password = body.get("passWord");

  const token = await authenticateUser(userName, password);

  if (token === false) {
    return c.redirect("/login?error=wrongpassword");
  }
  setCookie(c, "token", token);
  return c.redirect("/");
});

app.get("/logout", async (c) => {
  setCookie(c, "token", "");
  return c.redirect("/login");
});

app.post("/upload-avatar", auth, async (c) => {
  const body = await c.req.parseBody();
  const file = body["avatar"];
  const user = c.get("user");

  // unikátní název souboru aby se nepřepisovaly
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `public/uploads/avatars/${fileName}`;

  // převedeme File na buffer a zapíšeme na disk
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (user.avatarURL) {
    await fs.unlink(user.avatarURL).catch(() => {});
  }

  await fs.writeFile(filePath, buffer);

  await updateUserAvatar(user.id, filePath);

  return c.redirect("/profile");
});
// notfound
app.notFound(async (c) => {
  const notFound = await ejs.renderFile(
    "src/views/404.ejs",
    {},
    { views: ["src/views"] },
  );
  return c.html(notFound, 404);
});
// 500
app.onError((err, c) => {
  console.error(err);
  return c.html("<h1>500 - Chyba serveru</h1>", 500);
});

export { app, injectWebSocket };
