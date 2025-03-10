import { Effect } from "effect";
import * as assert from "node:assert";

import * as vscode from "vscode";
import { assertPythonExtension } from "./vsc/assert-python-extension";

suite("Extension Test Suite", () => {
	test("workspace root path exists", () => {
		const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
		assert.notStrictEqual(rootPath, "", "Root path should not be empty");
	});

	test("Python Extension is installed", async () => {
		const success = await assertPythonExtension().pipe(Effect.runPromise);
		assert.ok(success);
	});
});
