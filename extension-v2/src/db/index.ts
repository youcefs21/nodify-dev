//////////////////////////////////////////////////////////////////
// Don't worry about this file, it's just a bunch of code to make
// Kysely work with Effect.
//////////////////////////////////////////////////////////////////

import {
	type DeleteResult,
	type InsertResult,
	Kysely,
	type MergeResult,
	type NoResultErrorConstructor,
	type QueryNode,
	type Simplify,
	type UpdateResult,
	SqliteDialect,
} from "kysely";
import { Effect } from "effect";
import type { Database } from "./db-schema";
import { getNodifyWorkspaceDir } from "../utils/get-nodify-workspace-dir";
import { SQLocalKysely } from "sqlocal/kysely";

const { dialect } = new SQLocalKysely(
	`${getNodifyWorkspaceDir()}/plain_db.sqlite`,
);
export const db = new Kysely<Database>({
	dialect,
});

export type SimplifySingleResult<O> = O extends InsertResult
	? O
	: O extends DeleteResult
		? O
		: O extends UpdateResult
			? O
			: O extends MergeResult
				? O
				: Simplify<O> | undefined;

export class DBError {
	readonly _tag = "DBError";
	constructor(public readonly cause: Error) {}
}

// Extend Kysely's query builders with executeE method
declare module "kysely" {
	interface SelectQueryBuilder<DB, TB extends keyof DB, O> {
		executeE(): Effect.Effect<Simplify<O>[], DBError, never>;
		executeTakeFirstE(): Effect.Effect<SimplifySingleResult<O>, DBError, never>;
		executeTakeFirstOrThrowE(
			errorConstructor?:
				| NoResultErrorConstructor
				| ((node: QueryNode) => Error),
		): Effect.Effect<Simplify<O>, DBError, never>;
	}
	interface DeleteQueryBuilder<DB, TB extends keyof DB, O> {
		executeE(): Effect.Effect<Simplify<O>[], DBError, never>;
		executeTakeFirstE(): Effect.Effect<SimplifySingleResult<O>, DBError, never>;
		executeTakeFirstOrThrowE(
			errorConstructor?:
				| NoResultErrorConstructor
				| ((node: QueryNode) => Error),
		): Effect.Effect<Simplify<O>, DBError, never>;
	}
	interface UpdateQueryBuilder<
		DB,
		UT extends keyof DB,
		TB extends keyof DB,
		O,
	> {
		executeE(): Effect.Effect<Simplify<O>[], DBError, never>;
		executeTakeFirstE(): Effect.Effect<SimplifySingleResult<O>, DBError, never>;
		executeTakeFirstOrThrowE(
			errorConstructor?:
				| NoResultErrorConstructor
				| ((node: QueryNode) => Error),
		): Effect.Effect<Simplify<O>, DBError, never>;
	}
	interface InsertQueryBuilder<DB, TB extends keyof DB, O> {
		executeE(): Effect.Effect<Simplify<O>[], DBError, never>;
		executeTakeFirstE(): Effect.Effect<SimplifySingleResult<O>, DBError, never>;
		executeTakeFirstOrThrowE(
			errorConstructor?:
				| NoResultErrorConstructor
				| ((node: QueryNode) => Error),
		): Effect.Effect<Simplify<O>, DBError, never>;
	}
}

function extendQueryBuilder(sampleQuery: unknown) {
	// Store the original execute methods from the prototype
	const originalExecute = Object.getPrototypeOf(sampleQuery).execute;
	const originalExecuteTakeFirst =
		Object.getPrototypeOf(sampleQuery).executeTakeFirst;
	const originalExecuteTakeFirstOrThrow =
		Object.getPrototypeOf(sampleQuery).executeTakeFirstOrThrow;

	// Extend the execute methods
	Object.getPrototypeOf(sampleQuery).executeE = function (...args: unknown[]) {
		return Effect.tryPromise({
			try: () => originalExecute.apply(this, args),
			catch: (error) => new DBError(error as Error),
		});
	};
	Object.getPrototypeOf(sampleQuery).executeTakeFirstE = function (
		...args: unknown[]
	) {
		return Effect.tryPromise({
			try: () => originalExecuteTakeFirst.apply(this, args),
			catch: (error) => new DBError(error as Error),
		});
	};
	Object.getPrototypeOf(sampleQuery).executeTakeFirstOrThrowE = function (
		...args: unknown[]
	) {
		return Effect.tryPromise({
			try: () => originalExecuteTakeFirstOrThrow.apply(this, args),
			catch: (error) => new DBError(error as Error),
		});
	};
}

extendQueryBuilder(db.selectFrom("references"));
extendQueryBuilder(db.insertInto("references"));
extendQueryBuilder(db.updateTable("references"));
extendQueryBuilder(db.deleteFrom("references"));
