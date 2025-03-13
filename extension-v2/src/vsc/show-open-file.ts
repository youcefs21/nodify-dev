import { Effect } from "effect";
import * as vscode from "vscode";
import * as astGrep from "@ast-grep/napi";
import { Lang, type SgNode } from "@ast-grep/napi";
import { getAllFlowASTs } from "../ast/get-all-flows";
import { decodeLLMCodeBlocks } from "../ast/ast.schema";
import { getNodifyWorkspaceDir } from "../utils/get-nodify-workspace-dir";
import { writeFile } from "node:fs/promises";
import { dedupeAndSummarizeReferences } from "../ast/references";
import { getFlatReferencesListFromAST } from "../ast/references";

class NoPythonFileOpenError {
	readonly _tag = "NoPythonFileOpenError";
	readonly message = "You must have a Python file open to use this command";
}

/**
 * 📄 Get the text of the open Python file, preferring the active editor
 * @returns text of the open Python file
 */
export function getOpenPythonFileText() {
	return Effect.gen(function* () {
		// ✅ use the active editor if it's a Python file
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor && activeEditor.document.languageId === "python") {
			return {
				text: activeEditor.document.getText(),
				url: activeEditor.document.uri,
			};
		}

		// 🔍 otherwise, look for any visible Python editor
		const visibleEditors = vscode.window.visibleTextEditors;
		const pythonEditor = visibleEditors.find(
			(editor) => editor.document.languageId === "python",
		);
		if (pythonEditor) {
			return {
				text: pythonEditor.document.getText(),
				url: pythonEditor.document.uri,
			};
		}

		// ❌ No Python file found
		return yield* Effect.fail(new NoPythonFileOpenError());
	});
}

/**
 * 🌐 Shows the graph for the open Python file
 */
export function showOpenPythonFile() {
	return Effect.gen(function* () {
		// 📄 get the text of the open Python file
		const { text, url } = yield* getOpenPythonFileText();

		// get the AST for all the flows in the file
		const root = astGrep.parse(Lang.Python, text).root();
		const ast = yield* getAllFlowASTs({
			root: root.children(),
			parent_id: "",
			url,
		});

		// Process the references
		const references = getFlatReferencesListFromAST(ast);
		console.log(`Found ${references.length} references in the AST`);
		const processedRefs = yield* dedupeAndSummarizeReferences(references);
		const referenceMap = processedRefs.reduce(
			(map, ref) => {
				map[ref.shortId] = ref.summary;
				return map;
			},
			{} as Record<string, string>,
		);

		// LLM prompt context
		const promptContext = {
			ast: yield* decodeLLMCodeBlocks(ast),
			references: referenceMap,
		};

		// TEMPORARY: write the prompt context to a file
		const dir = getNodifyWorkspaceDir();
		const file = `${dir}/prompt.json`;
		yield* Effect.tryPromise(() =>
			writeFile(file, JSON.stringify(promptContext)),
		);
		console.log(JSON.stringify(promptContext));
	});
}
