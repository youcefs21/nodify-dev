import { Effect } from "effect";
import * as vscode from "vscode";
import * as astGrep from "@ast-grep/napi";
import { Lang } from "@ast-grep/napi";
import { getAllFlowASTs } from "../ast/get-all-flows";
import {
	type CodeBlock,
	type CodeReference,
	decodeLLMCodeBlocks,
} from "../ast/ast.schema";
import { dedupeAndSummarizeReferences } from "../ast/references";
import { getFlatReferencesListFromAST } from "../ast/references";
import { getAbstractionTree } from "../ast/llm";
import { createNodes, flattenCodeBlocks } from "../graph/create-nodes";
import { createEdges } from "../graph/create-edges";
import { postMessageToPanel } from "./webview/register-webview-command";
import { createGraphLayout } from "../graph/graph-layout-creator";
import type { CustomNode, NodeProps } from "../graph/graph.types";

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

function getReferenceNodes(ref: CodeReference, parentId: string) {
	return Effect.gen(function* () {
		const document = yield* Effect.tryPromise(() =>
			vscode.workspace.openTextDocument(ref.filePath),
		);
		const root = astGrep.parse(Lang.Python, document.getText()).root();
		const rawNodes = root.find({
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
		const block = rawNodes?.children().find((x) => x.kind() === "block");
		if (!block) {
			console.error("WTF NO BLOCK FOUND ON REF SEARCH");
			return { nodes: [], references: [], refID: ref.id };
		}

		const ast = yield* getAllFlowASTs({
			root: block.children(),
			parent_id: parentId,
			url: document.uri,
		});

		const nodes = yield* getNodesFromAst(ast, parentId);

		return { ...nodes, refID: ref.id };
	});
}

function getNodesFromAst(ast: CodeBlock[], parentId: string) {
	return Effect.gen(function* () {
		// Process the references
		const references = getFlatReferencesListFromAST(ast);
		console.log(`Found ${references.length} references in the AST`);
		const processedRefs = yield* dedupeAndSummarizeReferences(references);
		const referenceMap = processedRefs.reduce(
			(map, ref) => {
				map[ref.id] = { summary: ref.summary, symbol: ref.symbol };
				return map;
			},
			{} as Record<string, { summary: string; symbol: string }>,
		);

		// LLM prompt context
		const promptContext = {
			ast: yield* decodeLLMCodeBlocks(ast),
			references: referenceMap,
		};

		// get the abstraction tree
		const tree = yield* getAbstractionTree(promptContext);
		const flatCodeBlocks = flattenCodeBlocks(ast);

		// create the graph
		const nodes = createNodes(tree, flatCodeBlocks, parentId);

		return { nodes, references };
	});
}

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

function recursiveIDReplace(
	nodes: NodeProps[],
	replace: string,
	parent_id: string,
) {
	return nodes.map((node) => {
		// if the node id contains the replace string, replace it with the parent_id
		node.id = node.id.replace(replace, parent_id);
		if (node.children.length > 0) {
			node.children = recursiveIDReplace(node.children, replace, node.id);
		}
		return node;
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

		const { nodes, references } = yield* getNodesFromAst(ast, "root");
		// sendNodes(nodes);

		const newNodes = yield* Effect.forEach(
			nodes,
			(node) =>
				Effect.gen(function* () {
					const nodeId = node?.data.id.split("-")[0] ?? "";
					const ref = references.find((ref) => ref.id === node.data.refID);
					console.log(node);
					if (!ref) {
						console.error("WTF NO REF FOUND ON REF SEARCH");
						return [];
					}
					const res = yield* getReferenceNodes(ref, nodeId);
					node.data.children = res.nodes
						.filter((a) => a.data.parentId === nodeId)
						.map((a) => {
							a.data.parentId = node.data.id;
							return a.data;
						});
					return res.nodes;
				}),
			{ concurrency: 5 },
		).pipe(Effect.map((x) => x.flat()));

		sendNodes([...nodes, ...newNodes]);
	});
}
