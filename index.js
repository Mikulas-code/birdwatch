import { Hono } from "hono";
import { serve } from "@hono/node-server";
import ejs from "ejs";
import { addBird, deleteBird, getAllBirds, getBirdById, toggleBird, updateBird } from "./src/db.js";

import { drizzle } from "drizzle-orm/libsql"
import { eq } from "drizzle-orm"
import { birdsTable } from "./src/schema.js";
const app = new Hono();

// Homepage
app.get("/", async (c) => {
  const birds = await getAllBirds();
  const index = await ejs.renderFile(
    "src/views/index.ejs",
    { title: "Birds", birds },
    { views: ["src/views"] },
  );
  return c.html(index);
});

serve(app, (info) => {
  console.log(`Server listening at http://localhost:${info.port}`);
});

// pridavani ptaku
app.post("/add-bird", async (c) => {
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
    imageURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Parus_major_2_Luc_Viatour.jpg/1280px-Parus_major_2_Luc_Viatour.jpg",
    userId: 1,
  });
  return c.redirect("/");
});

// mazani ptaku
app.post("/remove-bird/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await deleteBird(id);
  return c.redirect("/");
});

// zmena stavu
app.post("/toggle-bird/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await toggleBird(id);
  return c.redirect("/");
});

// open edit
app.get("/open-edit/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const bird = await getBirdById(id);
  const edit = await ejs.renderFile(
    "src/views/edit.ejs",
    { title: "Edit " + bird.name, bird },
    { views: ["src/views"] },
  );
  return c.html(edit);
});

// save changes
app.post("/save-changes/:id", async (c) => {
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
    imageURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Parus_major_2_Luc_Viatour.jpg/1280px-Parus_major_2_Luc_Viatour.jpg",
    userId: 1,
  });
  return c.redirect("/");
});

// uzivatele
app.get("/register", async (c) => {
  const register = await ejs.renderFile(
    "src/views/register.ejs", {},
    { views: ["src/views"] },
  );
  return c.html(register);
});

app.get("/login", async (c) => {
  const login = await ejs.renderFile(
    "src/views/login.ejs", {},
    { views: ["src/views"] },
  );
  return c.html(login);
});