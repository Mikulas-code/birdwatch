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
