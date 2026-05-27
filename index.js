import { Hono } from "hono";
import { serve } from "@hono/node-server";
import ejs from "ejs";
import { drizzle } from "drizzle-orm/libsql"
import { birdsTable } from "./src/schema.js";

const db = drizzle({
  connection: "file:db.sqlite",
  logger: true,
})

const app = new Hono();


//endpoints
app.get("/", async (c) => {
  const birds = await db.select().from(birdsTable).all();
  const index = await ejs.renderFile("src/views/index.ejs", {
    title: "Birds",
    birds
  });

  return c.html(index);
});

serve(app, (info) => {
  console.log(`Server listening at http://localhost:${info.port}`);
});

app.post('/add-bird', async (c) => {
  const body = await c.req.formData();
  const name = body.get('name');
  const latinName = body.get('latinName');
  const order = body.get('order');
  const family = body.get('family');
  const date = body.get('date');
  const gender = body.get('gender') === 'true';
  const notes = body.get('notes');
  const count = body.get('count');
  const seen = body.get('seen') === 'true';
  const imageURL = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Parus_major_2_Luc_Viatour.jpg/1280px-Parus_major_2_Luc_Viatour.jpg";
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
  })

  return c.redirect('/')
})
