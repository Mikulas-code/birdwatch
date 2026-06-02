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
} from "./src/db.js";

import { getCookie, setCookie } from "hono/cookie";

import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { birdsTable } from "./src/schema.js";
import { error } from "node:console";
const app = new Hono();

app.use(async (c, next) => {
  const token = getCookie(c, "token");
  c.set("user", token ? await getUserByToken(token) : null);
  await next();
});

const auth = async (c, next) => {
  const user = c.get("user")
  if (!user) {
    return c.redirect("/login")
  }
  await next()
}

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

// pridavani ptaku
app.post("/add-bird", auth, async (c) => {
  const body = await c.req.formData();
  await addBird({
    name: body.get("name"),
    latinName: body.get("latinName"),
    order: body.get("order"),
    family: body.get("family"),
    date: body.get("date"),
    gender: body.get("gender") === "true",
    notes: body.get("notes"),
    count: body.get("count"),
    seen: body.get("seen") === "true",
    imageURL:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Parus_major_2_Luc_Viatour.jpg/1280px-Parus_major_2_Luc_Viatour.jpg",
    userId: 1,
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
app.post("/save-changes/:id", auth ,async (c) => {
  const body = await c.req.formData();
  const id = Number(c.req.param("id"));
  await updateBird(id, {
    name: body.get("name"),
    latinName: body.get("latinName"),
    order: body.get("order"),
    family: body.get("family"),
    date: body.get("date"),
    gender: body.get("gender") === "true",
    notes: body.get("notes"),
    count: body.get("count"),
    seen: body.get("seen") === "true",
    imageURL:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Parus_major_2_Luc_Viatour.jpg/1280px-Parus_major_2_Luc_Viatour.jpg",
    userId: 1,
  });
  return c.redirect("/");
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
  setCookie(c, "token", "")
  return c.redirect("/login")
})