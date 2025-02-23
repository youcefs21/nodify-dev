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

					case "highlight-node-source": {
						await highlightNodeSource(context, message.idRange);
						return;
					}
				}
			});
		},
	);
}

export async function highlightNodeSource(
	context: vscode.ExtensionContext,
	idRange: [number, number],
) {
	// const activeEditor = vscode.window.activeTextEditor;
	// if (!activeEditor) {
	// 	vscode.window.showErrorMessage(
	// 		"No active text editor (cannot display code highlighting)",
	// 	);
	// 	return;
	// }

	// TODO get this info from elsewhere? we shouldnt need to reanalyze the document just to convert idranges back into locations
	let ast_locations: AstLocation[] = [];
	const visibleEditors = vscode.window.visibleTextEditors;
	const pythonEditor = visibleEditors.find(
		(editor) => editor.document.languageId === "python",
	);
	if (!pythonEditor) {
		vscode.window.showErrorMessage(
			"No active text editor (cannot display code highlighting)",
		);
		return;
	}

	const a = await analyzePythonDocument(pythonEditor.document, context);
	ast_locations = a.ast_locations;

	const highlightingDecoration = vscode.window.createTextEditorDecorationType({
		backgroundColor: "rgba(100, 100, 100, 0.9)",
		isWholeLine: false,
	});
	const ranges: vscode.Range[] = [];
	for (const astLocation of ast_locations) {
		if (astLocation.id >= idRange[0] && astLocation.id <= idRange[1]) {
			console.log("DEBUG ASTLOCATION FOR NODE 1", astLocation);
			console.log("DEBUG ASTLOCATION FOR NODE 2", astLocation.location);
			console.log("DEBUG ASTLOCATION FOR NODE 3", astLocation.location["0"]);
			console.log("DEBUG ASTLOCATION FOR NODE 4", astLocation.location[1]);

			console.log("DEBUG ASTLOCATION FOR NODE", astLocation);
			console.log("DEBUG ASTLOCATION FOR NODE LOCATION", astLocation.location);
			console.log("Type of location:", typeof astLocation.location);
			console.log("Instance check:", Array.isArray(astLocation.location));
			console.log("Keys in location:", Object.keys(astLocation.location));
			console.log("location[0]:", astLocation.location[0]);
			console.log("location[1]:", astLocation.location[1]);
			ranges.push(
				new vscode.Range(
					new vscode.Position(
						astLocation.location[0].line,
						astLocation.location[0].character,
					),
					new vscode.Position(
						astLocation.location[1].line,
						astLocation.location[1].character,
					),
				),
			);
		}
	}
	pythonEditor.setDecorations(highlightingDecoration, ranges);
	setTimeout(() => {
		pythonEditor.setDecorations(highlightingDecoration, []);
	}, 5000);
}
