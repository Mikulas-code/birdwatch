import { drizzle } from "drizzle-orm/libsql";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { birdsTable, usersTable } from "./schema.js";

const dbPath = process.env.DB_PATH || "file:db.sqlite"

export const db = drizzle({
  connection: dbPath,
  logger: false,
})

export async function addBird(data) {
  await db.insert(birdsTable).values(data);
}

export async function getAllBirds(userId, filters = {}) {
  const conditions = [eq(birdsTable.userId, userId)];

  if (filters.seen === "true") conditions.push(eq(birdsTable.seen, true));
  if (filters.seen === "false") conditions.push(eq(birdsTable.seen, false));
  if (filters.family) conditions.push(eq(birdsTable.family, filters.family));
  if (filters.order) conditions.push(eq(birdsTable.order, filters.order));

  return await db
    .select()
    .from(birdsTable)
    .where(and(...conditions))
    .all();
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
  await db.update(birdsTable).set(data).where(eq(birdsTable.id, id));
}

// uzivatele
export const createUser = async (name, password) => {
  const existing = await getUserByName(name);
  if (existing) return null; // uživatel už existuje

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  const token = crypto.randomBytes(16).toString("hex");

  await db.insert(usersTable).values({ userName: name, salt, hash, token });
  return await getUserByName(name)
};

export async function getUserByName(userName) {
  return await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.userName, userName))
    .get();
}

export async function getUserById(id) {
  return await db.select().from(usersTable).where(eq(usersTable.id, id)).get();
}

export async function getUserByToken(token) {
  return await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.token, token))
    .get();
}

export const authenticateUser = async (name, passWord) => {
  const user = await getUserByName(name);
  if (!user) return false;

  const salt = user.salt;
  const hash = crypto
    .pbkdf2Sync(passWord, salt, 100000, 64, "sha512")
    .toString("hex");

  if (hash === user.hash) {
    return user.token;
  }
  return false;
};

export async function updateUserAvatar(userId, filePath) {
  await db
    .update(usersTable)
    .set({ avatarURL: filePath })
    .where(eq(usersTable.id, userId));
}

export async function getAllBirdsWithUsers(filters = {}) {
  const conditions = [];
  if (filters.seen === "true") conditions.push(eq(birdsTable.seen, true));
  if (filters.seen === "false") conditions.push(eq(birdsTable.seen, false));
  if (filters.family) conditions.push(eq(birdsTable.family, filters.family));
  if (filters.order) conditions.push(eq(birdsTable.order, filters.order));

  return await db
    .select({
      id: birdsTable.id,
      name: birdsTable.name,
      latinName: birdsTable.latinName,
      date: birdsTable.date,
      seen: birdsTable.seen,
      imageURL: birdsTable.imageURL,
      family: birdsTable.family,
      order: birdsTable.order,
      userName: usersTable.userName,
      gender: birdsTable.gender,
      count: birdsTable.count,
    })
    .from(birdsTable)
    .leftJoin(usersTable, eq(birdsTable.userId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .all();
}

export async function getUserStats(userId) {
  const birds = await getAllBirds(userId);

  const totalBirds = birds.length;
  const seenBirds = birds.filter((b) => b.seen).length;

  const mostSpotted = birds.reduce(
    (max, b) => (b.count > (max?.count ?? 0) ? b : max),
    null,
  );

  const byFamily = Object.entries(
    birds.reduce((acc, b) => {
      if (b.family) acc[b.family] = (acc[b.family] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return { totalBirds, seenBirds, mostSpotted, byFamily };
}
