import * as assert from "node:assert";
import * as vscode from "vscode";
import * as path from "node:path";
import { before, suite, test } from "mocha";
import { parse, Lang } from "@ast-grep/napi";
import { Effect } from "effect";
import { getAllTypescriptFlowASTs } from "./get-all-flows";
import { assertTypeScriptExtension } from "../../vsc/assert-typescript-extension";

suite("TypeScript AST Test Suite", () => {
	let rootPath = "";

	suiteSetup(async () => {
		rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
		await assertTypeScriptExtension(true).pipe(Effect.runPromise);
	});

	test("Should parse TypeScript function reference", async () => {
		const filePath = path.join(rootPath, "test-ts.ts");
		const document = await vscode.workspace.openTextDocument(filePath);
		const root = parse(Lang.TypeScript, document.getText()).root();

		const ast = await getAllTypescriptFlowASTs({
			root: root.children(),
			parent_id: "",
			url: document.uri,
		}).pipe(Effect.runPromise);

		// Verify AST nodes were created
		assert.ok(ast.length > 0, "AST should contain nodes");

		assert.deepStrictEqual(ast, [
			{
				id: "0",
				text: "await add(1, 2);",
				range: {
					start: {
						line: 8,
						character: 0,
					},
					end: {
						line: 8,
						character: 16,
					},
				},
				filePath:
					"/Users/youcefboumar/Documents/School/Capstone2025/extension-v2/test-workspace/test-ts.ts",
				children: [],
				references: [
					{
						symbol: "add",
						id: "69e1184",
						lang: Lang.TypeScript,
						fullHash:
							"69e1184a09eed7785a8533403315741d14c70be20c43dd87064de9df658a65d9",
						body: "async function add(a: number, b: number): Promise<number> {\n\treturn new Promise((resolve) => {\n\t\tsetTimeout(() => {\n\t\t\tresolve(a + b);\n\t\t}, 1000);\n\t});\n}",
						range: {
							start: {
								line: 0,
								character: 7,
							},
							end: {
								line: 6,
								character: 1,
							},
						},
						filePath:
							"/Users/youcefboumar/Documents/School/Capstone2025/extension-v2/test-workspace/test-ts.ts",
					},
				],
			},
		]);
	});
});
