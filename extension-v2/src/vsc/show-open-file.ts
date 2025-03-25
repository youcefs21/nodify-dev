import { Effect } from "effect";
import * as vscode from "vscode";
import * as astGrep from "@ast-grep/napi";
import { Lang } from "@ast-grep/napi";
import { getGraphsFromAst } from "../graph/create-nodes";
import { createEdges } from "../graph/create-edges";
import { postMessageToPanel } from "./webview/register-webview-command";
import { createGraphLayout } from "../graph/graph-layout-creator";
import type { CustomNode } from "../graph/graph.types";
import { getReferenceGraphs } from "../ast/references";
import type { CodeReference } from "../ast/llm/llm.schema";
import { collapsedNodes } from "./webview/client-message-callback";
import { getAllFlowASTs } from "../ast/get-all-flow-asts";
import { hashString } from "../utils/hash";

class NoPythonFileOpenError {
	readonly _tag = "NoPythonFileOpenError";
	readonly message = "You must have a Python file open to use this command";
}

/**
 * 📄 Get the text of the open Python file, preferring the active editor
 * @returns text of the open Python file
 */
export function getOpenFileText(langs: string[]) {
	return Effect.gen(function* () {
		// ✅ use the active editor if it's a Python file
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor && langs.includes(activeEditor.document.languageId)) {
			return {
				text: activeEditor.document.getText(),
				url: activeEditor.document.uri,
				lang:
					activeEditor.document.languageId === "python"
						? Lang.Python
						: Lang.TypeScript,
			};
		}

		// 🔍 otherwise, look for any visible Python editor
		const visibleEditors = vscode.window.visibleTextEditors;
		const pythonEditor = visibleEditors.find((editor) =>
			langs.includes(editor.document.languageId),
		);
		if (pythonEditor) {
			return {
				text: pythonEditor.document.getText(),
				url: pythonEditor.document.uri,
				lang:
					pythonEditor.document.languageId === "python"
						? Lang.Python
						: Lang.TypeScript,
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
	startingCodeReference: null as CodeReference | null,
	visitedASTHashes: new Set<string>(),
	graph: [] as Graph[],
};

export function sendNodes(graph: Graph[]) {
	graphCache.graph = graph;
	const nodes = graph.flatMap(FlattenGraph).map((node) => {
		for (const child of node.children) {
			if (collapsedNodes.has(child.node.data.id)) {
				child.node.data.expanded = false;
			} else {
				child.node.data.expanded = true;
			}
		}
		if (
			node.children.length === 1 &&
			node.children[0].node.type === "summary"
		) {
			node.node.type = "summary";
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
export function showOpenFile(langs: Lang[]) {
	return Effect.gen(function* () {
		graphCache.visitedASTHashes.clear();
		if (!graphCache.startingCodeReference) {
			// 📄 get the text of the open Python file
			const { text, url, lang } = yield* getOpenFileText(
				langs.map((l) => l.toLowerCase()),
			);

			// get the AST for all the flows in the file
			const root = astGrep.parse(lang, text).root();
			const ast = yield* getAllFlowASTs({
				root: root.children(),
				parent_id: "",
				url,
				lang,
			});
			console.log(`Found AST for ${url}`);
			const { graphs, references } = yield* getGraphsFromAst(
				ast,
				url.fsPath,
				root,
				true,
				"Top Level Code, not inside a function or class",
			);
			sendNodes(graphs);
			yield* processAndShowReferences(graphs, references);
			sendNodes(graphs);
		} else {
			const res = yield* getReferenceGraphs(
				graphCache.startingCodeReference,
				true,
			);
			sendNodes(res.graphs);
			yield* processAndShowReferences(res.graphs, res.references);
			sendNodes(res.graphs);
		}
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
	depth = 0,
): Effect.Effect<void> {
	return Effect.forEach(
		graphs,
		(graph) =>
			Effect.gen(function* () {
				if (depth > 3) {
					return;
				}
				if (!graph?.node.data.refID) {
					return yield* processAndShowReferences(
						graph.children,
						references,
						depth + 1,
					);
				}

				const ref = references.find((ref) => ref.id === graph.node.data.refID);
				if (!ref) return []; // this actually early stops references that haven't been expanded yet

				const res = yield* getReferenceGraphs(ref, false);
				graph.node.data.children = res.graphs.map((a) => {
					a.node.data.parentId = graph.node.data.id;
					return a.node.data;
				});
				graph.children = res.graphs;
				collapsedNodes.add(graph.node.data.id);

				yield* processAndShowReferences(
					graph.children,
					[...references, ...res.references],
					depth + 1,
				);

				sendNodes(graphCache.graph);
			}),
		{ concurrency: 5 },
	).pipe(
		Effect.catchAll((e) => {
			console.error(e.message);
			return Effect.void;
		}),
	);
}
