import { Effect } from "effect";
import * as vscode from "vscode";
import * as astGrep from "@ast-grep/napi";
import { Lang } from "@ast-grep/napi";
import { getAllFlowASTs } from "../ast/get-all-flows";
import { getNodesFromAst } from "../graph/create-nodes";
import { createEdges } from "../graph/create-edges";
import { postMessageToPanel } from "./webview/register-webview-command";
import { createGraphLayout } from "../graph/graph-layout-creator";
import type { CustomNode } from "../graph/graph.types";
import { getReferenceNodes } from "../ast/references";
import type { CodeReference } from "../ast/ast.schema";

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
 * 🎨 Sends the nodes to the webview
 * @param nodes The nodes to send
 */
function sendNodes(nodes: CustomNode[]) {
	const parentNodes = nodes.filter((node) => node.data.children.length > 0);
	const edges = createEdges(parentNodes);
	const layouted = createGraphLayout(parentNodes, edges);

	postMessageToPanel({
		type: "nodes",
		value: layouted.nodes,
	});

	postMessageToPanel({
		type: "all-nodes",
		value: nodes,
	});

	postMessageToPanel({
		type: "edges",
		value: layouted.edges,
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
		console.log(`Found AST for ${url}`);

		const { nodes, references } = yield* getNodesFromAst(ast);
		sendNodes(nodes);

		yield* processAndShowReferences(nodes, references);
	});
}

/**
 * 🔍 Gets the nodes for the references
 * @param nodes The nodes to get the references for
 * @param references The references to get the nodes for
 * @returns The nodes for the references
 */
function processAndShowReferences(
	nodes: CustomNode[],
	references: CodeReference[],
) {
	return Effect.gen(function* () {
		const newNodes = yield* Effect.forEach(
			nodes,
			(node) =>
				Effect.gen(function* () {
					if (!node?.data.refID) return [];

					const ref = references.find((ref) => ref.id === node.data.refID);
					if (!ref) {
						console.error("WTF NO REF FOUND ON REF SEARCH");
						return [];
					}
					const res = yield* getReferenceNodes(ref);
					node.data.children = res.nodes
						.filter((a) => a.data.parentId === "root")
						.map((a) => {
							a.data.parentId = node.data.id;
							a.data.expanded = false;
							return a.data;
						});
					return res.nodes;
				}),
			{ concurrency: 5 },
		).pipe(Effect.map((x) => x.flat()));

		sendNodes([...nodes, ...newNodes]);
	});
}
