import test from "ava"
import { createUser, authenticateUser, db } from "../src/db.js"
import { usersTable, birdsTable } from "../src/schema.js"

test.before(async () => {
  await db.delete(birdsTable) 
  await db.delete(usersTable)
})

test.serial("createUser vytvoří uživatele", async (t) => {
  const user = await createUser("testuser", "heslo123")
  t.truthy(user)
})

test.serial("heslo není uloženo jako plaintext", async (t) => {
  const user = await createUser("testuser2", "heslo123")
  t.not(user, "heslo123")
})

test.serial("authenticateUser vrátí token při správném hesle", async (t) => {
  await createUser("testuser3", "heslo123")
  const token = await authenticateUser("testuser3", "heslo123")
  t.truthy(token)
})

test.serial("authenticateUser vrátí false při špatném hesle", async (t) => {
  await createUser("testuser4", "heslo123")
  const result = await authenticateUser("testuser4", "spatneheslo")
  t.is(result, false)
})