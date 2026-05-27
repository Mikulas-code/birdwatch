import { sqliteTable, int, text } from "drizzle-orm/sqlite-core"
export const usersTable = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  userName: text().notNull(),
  salt: text().notNull(),
  hash: text().notNull(),
  token: text().notNull(),
})



export const birdsTable = sqliteTable("birds", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  latinName: text(),
  order: text(),
  family: text(),
  date: text(),
  gender: int({ mode: "boolean" }),
  notes: text(),
  count: int(),
  seen: int({ mode: "boolean" }).notNull(),
  imageURL: text(),
  userId: int().references(() => usersTable.id),
})