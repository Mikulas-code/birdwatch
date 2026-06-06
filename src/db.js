import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { birdsTable, usersTable } from "./schema.js";

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
  await db.update(birdsTable).set(data).where(eq(birdsTable.id, id));
}

// uzivatele
export const createUser = async (name, password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  const token = crypto.randomBytes(16).toString("hex");

  await db.insert(usersTable).values({ userName: name, salt, hash, token });
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
