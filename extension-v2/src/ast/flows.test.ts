import { Effect } from "effect";
import * as assert from "node:assert";
import * as path from "node:path";

import * as vscode from "vscode";
import { getAllFlowASTs } from "./get-all-flows";
import { Lang, parse } from "@ast-grep/napi";
import { assertPythonExtension } from "../vsc/assert-python-extension";

let rootPath: string;

suite("AST Test Suite", () => {
	suiteSetup(async () => {
		rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
		await assertPythonExtension(true).pipe(Effect.runPromise);
	});

	test("parse AST Hello World", async () => {
		const filePath = path.join(rootPath, "hello-world.py");
		const hello_world = await vscode.workspace.openTextDocument(filePath);
		const root = parse(Lang.Python, hello_world.getText()).root();
		const ast = await getAllFlowASTs({
			root: root.children(),
			parent_id: "",
			url: hello_world.uri,
		}).pipe(Effect.runPromise);

		assert.ok(ast.length === 1);
		assert.ok(!("children" in ast[0]));
		assert.strictEqual(ast[0].text, `print("Hello, World!")`);
		assert.strictEqual(ast[0].id, "0");
	});

	test("Local Function Definition", async () => {
		const filePath = path.join(rootPath, "local-func-call.py");
		const local_function_definition =
			await vscode.workspace.openTextDocument(filePath);
		const root = parse(Lang.Python, local_function_definition.getText()).root();
		const ast = await getAllFlowASTs({
			root: root.children(),
			parent_id: "",
			url: local_function_definition.uri,
		}).pipe(Effect.runPromise);

		const ref = ast[0].references?.[0];
		assert.ok(ref);

		const result = root.find({
			rule: {
				range: {
					start: {
						line: ref.range.start.line,
						column: ref.range.start.character,
					},
					end: {
						line: ref.range.end.line,
						column: ref.range.end.character,
					},
				},
			},
		});

		assert.strictEqual(result?.text(), "def add(a, b):\n    return a + b");
	});
});
