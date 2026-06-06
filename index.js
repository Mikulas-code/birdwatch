import { Hono } from "hono";
import { serve } from "@hono/node-server";
import ejs from "ejs";
import {
  addBird,
  authenticateUser,
  createUser,
  deleteBird,
  getAllBirds,
  getBirdById,
  getUserByToken,
  toggleBird,
  updateBird,
  updateUserAvatar,
} from "./src/db.js";

import { getCookie, setCookie } from "hono/cookie";

import fs from "fs/promises";

import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { birdsTable } from "./src/schema.js";
import { error, time } from "node:console";

import { serveStatic } from "@hono/node-server/serve-static";
const app = new Hono();
app.use("/public/*", serveStatic({ root: "./" }));

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
  const birds = await getAllBirds();
  const user = c.get("user");
  const index = await ejs.renderFile(
    "src/views/index.ejs",
    { title: "Birds", birds, user },
    { views: ["src/views"] },
  );
  return c.html(index);
});

serve(app, (info) => {
  console.log(`Server listening at http://localhost:${info.port}`);
});

app.get("/profile", auth, async (c) => {
  const user = c.get("user");
  const profile = await ejs.renderFile(
    "src/views/profile.ejs",
    { title: "Profile", user },
    { views: ["src/views"] },
  );
  return c.html(profile);
});

// pridavani ptaku
app.post("/add-bird", auth, async (c) => {
  const body = await c.req.parseBody();

  const file = body["image"];
  let imageURL = null;

  if (file && file.size > 0) {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `public/uploads/birds/${fileName}`;
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    imageURL = filePath;
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
    imageURL,
    userId: c.get("user").id,
  });
  return c.redirect("/");
});

// mazani ptaku
app.post("/remove-bird/:id", auth, async (c) => {
  const id = Number(c.req.param("id"));
  await deleteBird(id);
  return c.redirect("/");
});

// zmena stavu
app.post("/toggle-bird/:id", auth, async (c) => {
  const id = Number(c.req.param("id"));
  await toggleBird(id);
  return c.redirect("/");
});

// open edit
app.get("/open-edit/:id", auth, async (c) => {
  const id = Number(c.req.param("id"));
  const user = c.get("user");
  const bird = await getBirdById(id);
  const edit = await ejs.renderFile(
    "src/views/edit.ejs",
    { title: "Edit " + bird.name, bird, user },
    { views: ["src/views"] },
  );
  return c.html(edit);
});

// save changes
app.post("/save-changes/:id", auth, async (c) => {
   const body = await c.req.parseBody()
  const id = Number(c.req.param("id"))
  
  const file = body["image"]
  let imageURL = undefined
  
  if (file && file.size > 0) {
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `public/uploads/birds/${fileName}`
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()))
    imageURL = filePath
  }
  const bird = await getBirdById(id);
  if (bird.imageURL) {
    await fs.unlink(bird.imageURL).catch(() => {});
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
  })
  return c.redirect(`/open-edit/${id}`)
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
  createUser(userName, password);

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
