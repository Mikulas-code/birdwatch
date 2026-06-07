import test from "ava";
import {
  addBird,
  deleteBird,
  toggleBird,
  getAllBirds,
  getAllBirdsWithUsers,
  getBirdById,
  db,
  createUser,
  getUserByName,
} from "../src/db.js";
import { birdsTable, usersTable } from "../src/schema.js";

let userId;

test.before(async () => {
  await db.delete(birdsTable);
  await db.delete(usersTable);
  await createUser("testuser", "test");
  const user = await getUserByName("testuser");
  userId = user.id;
});

const getTestBird = () => ({
  name: "Testovací pták",
  latinName: "Testus birdus",
  order: "Pěvci",
  family: "Testovití",
  date: "2024-01-01",
  gender: true,
  notes: "Testovací poznámka",
  count: 1,
  seen: true,
  imageURL: null,
  audioURL: null,
  lat: null,
  lng: null,
  userId,
});

test.serial("getAllBirds vrátí prázdný seznam", async (t) => {
  const birds = await getAllBirds(userId, {});
  t.is(birds.length, 0);
});

test.serial("addBird vytvoří ptáka", async (t) => {
  await addBird(getTestBird());
  const birds = await getAllBirds(userId, {});
  t.is(birds.length, 1);
});

test.serial("getAllBirds vrátí jen ptáky daného uživatele", async (t) => {
  await addBird(getTestBird());
  const birds = await getAllBirds(userId, {});
  t.true(birds.every((b) => b.userId === userId));
});

test.serial("getAllBirdsWithUsers vrátí ptáky s userName", async (t) => {
  const birds = await getAllBirdsWithUsers({});
  t.true(birds.every((b) => b.userName !== undefined));
});

test.serial("togglebird změní stav ptáka", async (t) => {
  await addBird(getTestBird());
  const birds = await getAllBirds(userId, {});
  const bird = birds[birds.length - 1];
  await toggleBird(bird.id);
  const toggledBird = await getBirdById(bird.id);
  t.false(toggledBird.seen);
});

test.serial("getBirdById vrátí ptáka podle id", async (t) => {
  await addBird(getTestBird());
  const birds = await getAllBirds(userId, {});
  const bird = birds[birds.length - 1];

  const returnedBird = await getBirdById(bird.id);
  t.deepEqual(bird, returnedBird);
});

test.serial("deleteBird smaže ptáka", async (t) => {
  await addBird(getTestBird());
  const birds = await getAllBirds(userId, {});
  const bird = birds[birds.length - 1];

  const numberOfBirdsBeforeDelete = birds.length;
  await deleteBird(bird.id);

  const birdsAfterDelete = await getAllBirds(userId, {});
  const numberOfBirdsAfterDelete = birdsAfterDelete.length;

  t.is(numberOfBirdsAfterDelete, numberOfBirdsBeforeDelete - 1);
});
