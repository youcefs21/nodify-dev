import * as vscode from "vscode";
import {
	analyzePythonDocument,
	analyzePythonBlock,
	type AstLocation,
} from "./analyze-document";
import type {
	ClientToServerEvents,
	LLMOutput,
	ServerToClientEvents,
} from "../types";
import {
	AbstractionLevelOneNodeMapper,
	createEdges,
	entryNode,
	flattenCustomNodes,
} from "../graph/NodeCreater";
import { readLLMCache, readLLMCacheFromAST } from "../db/jsonDB";
import type { Reference } from "../ast/flow";
import { extractCodeBlock } from "../ast/expressions";
const panelRef = {
	current: null as vscode.WebviewPanel | null,
};

export const postMessageToPanel = (message: ServerToClientEvents) =>
	panelRef.current?.webview.postMessage(JSON.stringify(message));

const expanded = new Map<string, boolean>([
	["-1", true],
	["-2", true],
]);

export function getActiveHash(context: vscode.ExtensionContext): string {
	return context.workspaceState.get<string>("activeHashRef", "");
}

export async function setActiveHash(
	context: vscode.ExtensionContext,
	hash: string,
) {
	await context.workspaceState.update("activeHashRef", hash);
}

export async function refreshNodes(context: vscode.ExtensionContext) {
	let graph: LLMOutput[] = [];
	let ast_locations: AstLocation[] = [];
	const visibleEditors = vscode.window.visibleTextEditors;
	const pythonEditor = visibleEditors.find(
		(editor) => editor.document.languageId === "python",
	);
	if (pythonEditor) {
		const a = await analyzePythonDocument(pythonEditor.document, context);
		ast_locations = a.ast_locations;
		graph = a.graph;
	} else {
		vscode.window.showErrorMessage(
			"Please open a Python file in another editor pane",
		);
	}

	const nodes = flattenCustomNodes(
		AbstractionLevelOneNodeMapper(graph, expanded),
	);
	postMessageToPanel({
		type: "nodes",
		value: nodes,
	});
	const edges = createEdges(nodes);
	postMessageToPanel({
		type: "edges",
		value: edges,
	});
	postMessageToPanel({
		type: "ast_locations",
		value: ast_locations,
	});
}

export async function createWebview(
	context: vscode.ExtensionContext,
	onClientMessage: (
		message: ClientToServerEvents,
		panel: vscode.WebviewPanel,
	) => void,
) {
	const panel = vscode.window.createWebviewPanel(
		"nodifyWebview",
		"Nodify",
		vscode.ViewColumn.Beside,
		{
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(context.extensionUri, "webview-ui/dist"),
			],
		},
	);

	panelRef.current = panel;

	// Handle panel disposal
	panel.onDidDispose(
		() => {
			panelRef.current = null;
		},
		null,
		context.subscriptions,
	);

	// Get path to resource on disk
	const reactDistPath = vscode.Uri.joinPath(
		context.extensionUri,
		"webview-ui/dist",
	);

	// And get the special URI to use with the webview
	const webviewUri = panel.webview.asWebviewUri(reactDistPath);

	panel.webview.html = `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Nodify</title>
				<script type="module" crossorigin src="${webviewUri}/assets/index.js"></script>
				<link rel="stylesheet" href="${webviewUri}/assets/index.css">
			</head>
			<body>
				<div id="root"></div>
			</body>
			</html>`;

	// Handle messages from the webview
	panel.webview.onDidReceiveMessage(
		async (message) => {
			onClientMessage(message, panel);
		},
		undefined,
		context.subscriptions,
	);
	await refreshNodes(context);

	return panel;
}

export function registerWebview(context: vscode.ExtensionContext) {
	//
	// Register webview command
	return vscode.commands.registerCommand(
		"nodify.openWebview",
		async (ref?: Reference) => {
			// If we already have a panel, show it instead of creating a new one
			if (panelRef.current) {
				panelRef.current.reveal(vscode.ViewColumn.Beside);
				return;
			}

			if (ref) {
				//
				const document = await vscode.workspace.openTextDocument(ref.file);
				analyzePythonBlock(document, ref, context);
			}

			await createWebview(context, async (message) => {
				switch (message.type) {
					// sent when the webview is loaded
					// vscode.window.showInformationMessage(message.value);
					case "on-render": {
						await refreshNodes(context);
						return;
					}

					case "node-toggle": {
						// expand nodeId, and refresh nodes
						expanded.set(message.nodeId, !expanded.get(message.nodeId));
						await refreshNodes(context);
						return;
					}
				}
			});
		},
	);
}
