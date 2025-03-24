import { Effect } from "effect";
import * as assert from "node:assert";
import * as path from "node:path";

import * as vscode from "vscode";
import { getAllPythonFlowASTs } from "./get-all-flows";
import { Lang, parse } from "@ast-grep/napi";
import { assertPythonExtension } from "../../vsc/assert-python-extension";

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
		const ast = await getAllPythonFlowASTs({
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
		const ast = await getAllPythonFlowASTs({
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

	test("Try Except Statement", async () => {
		const filePath = path.join(rootPath, "try-except.py");
		const try_except_statement =
			await vscode.workspace.openTextDocument(filePath);
		const root = parse(Lang.Python, try_except_statement.getText()).root();
		const ast = await getAllPythonFlowASTs({
			root: root.children(),
			parent_id: "",
			url: try_except_statement.uri,
		}).pipe(Effect.runPromise);

		assert.ok(ast.length === 3);
		assert.ok(
			"children" in ast[0] && "children" in ast[1] && "children" in ast[2],
		);

		// Verify placeholder replacement
		assert.ok(ast[0].text.includes("<try_statement_body/>"));
		assert.ok(ast[1].text.includes("<except_clause_body/>"));
		assert.ok(ast[2].text.includes("<finally_clause_body/>"));
	});

	test("If Else Statement", async () => {
		const filePath = path.join(rootPath, "if-else.py");
		const if_else_statement = await vscode.workspace.openTextDocument(filePath);
		const root = parse(Lang.Python, if_else_statement.getText()).root();
		const ast = await getAllPythonFlowASTs({
			root: root.children(),
			parent_id: "",
			url: if_else_statement.uri,
		}).pipe(Effect.runPromise);

		// We expect 4 nodes: if, 2 elifs, and else
		assert.ok(ast.length === 4);

		// Check that all statements have children property
		assert.ok(
			"children" in ast[0] &&
				"children" in ast[1] &&
				"children" in ast[2] &&
				"children" in ast[3],
		);

		// Verify placeholder replacement
		assert.ok(ast[0].text.includes("<if_statement_body/>"));
		assert.ok(ast[1].text.includes("<elif_clause_body/>"));
		assert.ok(ast[2].text.includes("<elif_clause_body/>"));
		assert.ok(ast[3].text.includes("<else_clause_body/>"));
	});
});
