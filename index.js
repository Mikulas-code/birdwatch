import { Hono } from "hono";
import { serve } from "@hono/node-server";
import ejs from "ejs";
import { drizzle } from "drizzle-orm/libsql";
import { birdsTable } from "./src/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle({
  connection: "file:db.sqlite",
  logger: true,
});

const app = new Hono();

//endpoints
// Homepage
app.get("/", async (c) => {
  const birds = await db.select().from(birdsTable).all();
  const index = await ejs.renderFile(
    "src/views/index.ejs",
    {
      title: "Birds",
      birds,
    },
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
  const name = body.get("name");
  const latinName = body.get("latinName");
  const order = body.get("order");
  const family = body.get("family");
  const date = body.get("date");
  const gender = body.get("gender") === "true";
  const notes = body.get("notes");
  const count = body.get("count");
  const seen = body.get("seen") === "true";
  const imageURL =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Parus_major_2_Luc_Viatour.jpg/1280px-Parus_major_2_Luc_Viatour.jpg";
  const userId = 1;
  await db.insert(birdsTable).values({
    name,
    latinName,
    order,
    family,
    date,
    gender,
    notes,
    count,
    seen,
    imageURL,
    userId,
  });

  return c.redirect("/");
});

// mazani ptaku
app.post("/remove-bird/:id", async (c) => {
  const id = Number(c.req.param("id"));

  await db.delete(birdsTable).where(eq(birdsTable.id, id));

  return c.redirect("/");
});
// zmena stavu
app.post("/toggle-bird/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const bird = await db
    .select()
    .from(birdsTable)
    .where(eq(birdsTable.id, id))
    .get();

  await db
    .update(birdsTable)
    .set({ seen: !bird.seen })
    .where(eq(birdsTable.id, id));

  return c.redirect("/");
});

// open edit
app.get("/open-edit/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const bird = await db
    .select()
    .from(birdsTable)
    .where(eq(birdsTable.id, id))
    .get();

  const edit = await ejs.renderFile(
    "src/views/edit.ejs",
    {
      title: "Edit " + bird.name,
    bird,
    },
    { views: ["src/views"] },
  );

  return c.html(edit);
});

// save changes
app.post("/save-changes/:id", async (c) => {
  const body = await c.req.formData();
  const id = Number(c.req.param("id"));
  const bird = await db
    .select()
    .from(birdsTable)
    .where(eq(birdsTable.id, id))
    .get();

  const name = body.get("name");
  const latinName = body.get("latinName");
  const order = body.get("order");
  const family = body.get("family");
  const date = body.get("date");
  const gender = body.get("gender") === "true";
  const notes = body.get("notes");
  const count = body.get("count");
  const seen = body.get("seen") === "true";
  const imageURL =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Parus_major_2_Luc_Viatour.jpg/1280px-Parus_major_2_Luc_Viatour.jpg";
  const userId = 1;

  await db
    .update(birdsTable)
    .set({
      name: name,
      latinName: latinName,
      order: order,
      family: family,
      date: date,
      gender: gender,
      notes: notes,
      count: count,
      seen: seen,
      imageURL: imageURL,
      userId: userId,
    })
    .where(eq(birdsTable.id, id));

  return c.redirect("/");
});


app.get("/register", async (c) => {
 
  const register = await ejs.renderFile(
    "src/views/register.ejs",
    { views: ["src/views"] },
  );

  return c.html(register);
});

app.get("/login", async (c) => {
 
  const login = await ejs.renderFile(
    "src/views/login.ejs",
    { views: ["src/views"] },
  );

  return c.html(login);
});