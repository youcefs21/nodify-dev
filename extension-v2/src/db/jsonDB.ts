import fs from "node:fs/promises";
import { Effect } from "effect";
import { getNodifyWorkspaceDir } from "../utils/get-nodify-workspace-dir";

export function initDB() {
	return Effect.gen(function* () {
		const dirPath = getNodifyWorkspaceDir();
		// make a dir if doesn't exist already
		yield* Effect.tryPromise(() =>
			fs.mkdir(`${dirPath}/abstraction_tree_cache`, { recursive: true }),
		);
		yield* Effect.tryPromise(() =>
			fs.mkdir(`${dirPath}/summaries_cache`, { recursive: true }),
		);

		// create a .gitignore with just the text content "*" in the folder if it doesn't already exist
		const gitignorePath = `${dirPath}/.gitignore`;

		const gitignoreExists = yield* Effect.promise(() =>
			fs
				.access(gitignorePath)
				.then(() => true)
				.catch(() => false),
		);

		if (!gitignoreExists) {
			yield* Effect.tryPromise(() => fs.writeFile(gitignorePath, "*"));
		}
	});
}
