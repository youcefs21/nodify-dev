import { Effect } from "effect";
import * as vscode from "vscode";
import * as astGrep from "@ast-grep/napi";
import { Lang, type SgNode } from "@ast-grep/napi";
import { getAllFlowASTs } from "../ast/get-all-flows";
import {
	getReferencesForPrompt,
	processCodeReferences,
} from "../utils/reference-store";
import { extractReferencesFromAST } from "../ast/flatten-references";

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

		// for all references, we need to:
		// 1. get their body
		// 2. hash the full body, use it as the reference ID
		//   2.1. in the prompt, use the shortest unique identifier for the reference (similar to a git commit hash)
		// 3. create a summary of the reference
		// 4. provide reference summaries with the prompt

		// Extract all references from the AST
		const references = extractReferencesFromAST(ast);
		console.log(`Found ${references.length} references in the AST`);

		// Debug: Log the first few references
		if (references.length > 0) {
			console.log(
				"Sample references:",
				JSON.stringify(references.slice(0, 3), null, 2),
			);
		}

		// Process the references if any were found
		if (references.length > 0) {
			const processedRefs = yield* processCodeReferences(references);
			console.log(`Processed ${processedRefs.length} references`);

			// Debug: Log the first few processed references
			console.log(
				"Sample processed references:",
				JSON.stringify(processedRefs.slice(0, 3), null, 2),
			);
		}

		// Get references formatted for the prompt
		const referenceMap = getReferencesForPrompt();

		// This would be used in the prompt to provide context about references
		const promptContext = {
			ast,
			references: referenceMap,
		};

		console.log(
			"Prompt context references count:",
			Object.keys(referenceMap).length,
		);
	});
}
