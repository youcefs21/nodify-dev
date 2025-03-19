import { Effect } from "effect";
import type { ClientToServerEvents } from "../../shared-types";
import { webviewPanelRef } from "./register-webview-command";
import * as vscode from "vscode";
import { graphCache, sendNodes, showOpenPythonFile } from "../show-open-file";

type ClientEvent<T extends ClientToServerEvents["type"]> = Extract<
	ClientToServerEvents,
	{ type: T }
>;

export const collapsedNodes = new Set<string>();

function handleNodeToggle(message: ClientEvent<"node-toggle">) {
	if (collapsedNodes.has(message.nodeId)) {
		collapsedNodes.delete(message.nodeId);
	} else {
		collapsedNodes.add(message.nodeId);
	}
	sendNodes(graphCache.ref);
	return Effect.void;
}

const activeHighlight = {
	decoration: null as vscode.TextEditorDecorationType | null,
	timeout: null as NodeJS.Timeout | null,
};

function handleHighlightNode({
	codeRange,
	filePath,
	nodeId,
}: ClientEvent<"highlight-node">) {
	console.log("highlight-node", { codeRange, filePath, nodeId });
	return Effect.gen(function* () {
		const document = yield* Effect.tryPromise(() =>
			vscode.workspace.openTextDocument(filePath),
		);
		const editor = yield* Effect.tryPromise(() =>
			vscode.window.showTextDocument(document, vscode.ViewColumn.One, true),
		);
		const highlightingDecoration = vscode.window.createTextEditorDecorationType(
			{
				backgroundColor: "rgba(100, 100, 100, 0.8)",
				isWholeLine: false,
			},
		);
		const range = new vscode.Range(
			new vscode.Position(
				codeRange[0].start.line,
				codeRange[0].start.character,
			),
			new vscode.Position(codeRange[1].end.line, codeRange[1].end.character),
		);
		editor.setDecorations(highlightingDecoration, [range]);

		// Scroll the highlighted section into view
		editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

		if (activeHighlight.timeout) {
			clearTimeout(activeHighlight.timeout);
		}
		if (activeHighlight.decoration) {
			editor.setDecorations(activeHighlight.decoration, []);
		}
		activeHighlight.decoration = highlightingDecoration;
		activeHighlight.timeout = setTimeout(() => {
			editor.setDecorations(highlightingDecoration, []);
		}, 5000);
	});
}

export type OnClientMessageT = typeof onClientMessage;

/**
 * Handles incoming messages from the webview client
 * @param message - The message from the webview client
 */
export function onClientMessage(
	context: vscode.ExtensionContext,
	message: ClientToServerEvents,
) {
	const panel = webviewPanelRef.current;
	if (!panel) throw new Error("No webview panel found");

	return Effect.gen(function* () {
		console.log(message);
		switch (message.type) {
			case "on-render": {
				yield* showOpenPythonFile();
				break;
			}

			case "node-toggle": {
				yield* handleNodeToggle(message);
				break;
			}

			case "highlight-node": {
				yield* handleHighlightNode(message);
				break;
			}
		}
	}).pipe(
		Effect.catchAll((error) => {
			vscode.window.showErrorMessage(error.message);
			console.error(error);
			return Effect.void;
		}),
		Effect.catchAllDefect((error) => {
			vscode.window.showErrorMessage(`DEFECT: ${error}`);
			console.error("DEFECT: ", error);
			return Effect.void;
		}),
		Effect.runFork,
	);
}
