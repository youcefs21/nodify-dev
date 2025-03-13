import { sql } from "kysely";
import { db } from ".";
import type ReferencesTable from "./types/refrences";
import { Effect } from "effect";

export function createDatabase() {
	return Effect.tryPromise(async () => {
		await db.schema
			.createTable("references")
			.ifNotExists()
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("symbol", "text", (col) => col.notNull())
			.addColumn("fullHash", "text", (col) => col.notNull())
			.addColumn("body", "text", (col) => col.notNull())
			.addColumn("summary", "text", (col) => col.notNull())
			.addColumn("createdAt", "datetime", (col) =>
				col.defaultTo(sql`date('now')`).notNull(),
			)
			.execute()
			.catch((error) => {
				console.error(error);
				return new Error("failed to create database");
			});
	});
}

export type Database = {
	references: ReferencesTable;
};
