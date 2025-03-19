import { Effect } from "effect";
import * as vscode from "vscode";
import * as astGrep from "@ast-grep/napi";
import { Lang } from "@ast-grep/napi";
import { getAllFlowASTs } from "../ast/get-all-flows";
import { getGraphsFromAst } from "../graph/create-nodes";
import { createEdges } from "../graph/create-edges";
import { postMessageToPanel } from "./webview/register-webview-command";
import { createGraphLayout } from "../graph/graph-layout-creator";
import type { CustomNode } from "../graph/graph.types";
import { getReferenceGraphs } from "../ast/references";
import type { CodeReference } from "../ast/ast.schema";
import { collapsedNodes } from "./webview/client-message-callback";
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

export interface Graph {
	node: CustomNode;
	children: Graph[];
}

/**
 * 🎨 Sends the nodes to the webview
 * @param nodes The nodes to send
 */
function FlattenGraph(graph: Graph): Graph[] {
	return [
		graph,
		...graph.children
			.filter((child) => !collapsedNodes.has(child.node.data.id))
			.flatMap(FlattenGraph),
	];
}

export const graphCache = {
	ref: [] as Graph[],
};

export function sendNodes(graph: Graph[]) {
	graphCache.ref = graph;
	const nodes = graph.flatMap(FlattenGraph).map((node) => {
		for (const child of node.children) {
			if (collapsedNodes.has(child.node.data.id)) {
				child.node.data.expanded = false;
			} else {
				child.node.data.expanded = true;
			}
		}
		return node.node;
	});
	const parentNodes = nodes.filter((node) => node.data.children.length > 0);
	const edges = createEdges(parentNodes);
	const layouted = createGraphLayout(parentNodes, edges);

	postMessageToPanel({
		type: "nodes",
		value: layouted.nodes,
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

		const { graphs, references } = yield* getGraphsFromAst(ast);
		sendNodes(graphs);

		yield* processAndShowReferences(graphs, references);
		sendNodes(graphs);
	});
}

/**
 * 🔍 Gets the nodes for the references
 * @param nodes The nodes to get the references for
 * @param references The references to get the nodes for
 * @returns The nodes for the references
 */
function processAndShowReferences(
	graphs: Graph[],
	references: CodeReference[],
): Effect.Effect<void> {
	return Effect.forEach(
		graphs,
		(graph) =>
			Effect.gen(function* () {
				if (!graph?.node.data.refID) {
					return yield* processAndShowReferences(graph.children, references);
				}

				const ref = references.find((ref) => ref.id === graph.node.data.refID);
				if (!ref) return []; // this actually early stops references that haven't been expanded yet

				const res = yield* getReferenceGraphs(ref);
				graph.node.data.children = res.graphs.map((a) => {
					a.node.data.parentId = graph.node.data.id;
					return a.node.data;
				});
				graph.children = res.graphs;
				collapsedNodes.add(graph.node.data.id);

				return yield* processAndShowReferences(graph.children, [
					...references,
					...res.references,
				]);
			}),
		{ concurrency: 5 },
	).pipe(
		Effect.catchAll((e) => {
			console.error(e.message);
			return Effect.void;
		}),
	);
}
