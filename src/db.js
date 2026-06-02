import { drizzle } from "drizzle-orm/libsql"
import { eq } from "drizzle-orm"
import { birdsTable } from "./schema.js"

const db = drizzle({
  connection: "file:db.sqlite",
  logger: true,
});

export async function addBird(data) {
  await db.insert(birdsTable).values(data);
}

export async function getAllBirds() {
  return await db.select().from(birdsTable).all();
}

export async function deleteBird(id) {
  await db.delete(birdsTable).where(eq(birdsTable.id, id));
}

export async function toggleBird(id) {
  const bird = await db
    .select()
    .from(birdsTable)
    .where(eq(birdsTable.id, id))
    .get();

  await db
    .update(birdsTable)
    .set({ seen: !bird.seen })
    .where(eq(birdsTable.id, id));
}

export async function getBirdById(id) {
  const bird = await db
    .select()
    .from(birdsTable)
    .where(eq(birdsTable.id, id))
    .get();

  return bird;
}
export async function updateBird(id, data) {
  await db.update(birdsTable).set(data).where(eq(birdsTable.id, id))
}
