import test from "ava"
import { app } from "../src/app.js"
import { addBird, createUser, db, getAllBirds, getUserByToken } from "../src/db.js"
import { usersTable, birdsTable } from "../src/schema.js"
import { authenticateUser } from "../src/db.js"
import { getUserByName } from "../src/db.js"

test.before(async () => {
  await db.delete(birdsTable)
  await db.delete(usersTable)
  await createUser("integrationuser", "heslo123")
  const user = await getUserByName("integrationuser")
  userId = user.id
})


let userId
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


test.serial("GET / přesměruje na login", async (t) => {
  const response = await app.request("/")
  t.is(response.status, 302)
  t.is(response.headers.get("location"), "/login")
})

test.serial("GET /login vrátí 200", async (t) => {
  const response = await app.request("/login")
  t.is(response.status, 200)
})

test.serial("GET /register vrátí 200", async (t) => {
  const response = await app.request("/register")
  t.is(response.status, 200)
})

test.serial("GET /neexistuje vrátí 404", async (t) => {
  const response = await app.request("/neexistuje")
  t.is(response.status, 404)
})

test.serial("GET /profile přesměruje na login", async (t) => {
  const response = await app.request("/profile")
  t.is(response.status, 302)
  t.is(response.headers.get("location"), "/login")
})

test.serial("GET /community přesměruje na login", async (t) => {
  const response = await app.request("/community")
  t.is(response.status, 302)
  t.is(response.headers.get("location"), "/login")
})

// po prihlaseni
test.serial("GET / vrátí 200 pro přihlášeného uživatele", async (t) => {
  const token = await authenticateUser("integrationuser", "heslo123")
  const response = await app.request("/", {
    headers: {
      "Cookie": `token=${token}`
    }
  })
  t.is(response.status, 200)
})


test.serial("GET /profile vrátí 200 pro přihlášeného uživatele", async (t) => {
  const token = await authenticateUser("integrationuser", "heslo123")
  const response = await app.request("/profile", {
    headers: {
      "Cookie": `token=${token}`
    }
  })
  t.is(response.status, 200)
})


test.serial("GET /comummity vrátí 200 pro přihlášeného uživatele", async (t) => {
  const token = await authenticateUser("integrationuser", "heslo123")
  const response = await app.request("/community", {
    headers: {
      "Cookie": `token=${token}`
    }
  })
  t.is(response.status, 200)
})


test.serial("GET /open-edit/id vrátí 200 pro přihlášeného uživatele", async (t) => {
  const token = await authenticateUser("integrationuser", "heslo123")
  const user = await getUserByToken(token);
  await addBird(getTestBird());
  const birds = await getAllBirds(user.id, {});
  const bird = birds[0];
  const response = await app.request(`/open-edit/${bird.id}`, {
    headers: {
      "Cookie": `token=${token}`
    }
  })
  t.is(response.status, 200)
})
