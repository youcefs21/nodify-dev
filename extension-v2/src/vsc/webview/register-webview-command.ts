import * as vscode from "vscode";
import { createWebview } from "./create-webview";
import { NodifyWebviewSerializer } from "./webview-serializer";
import { onClientMessage } from "./client-message-callback";
import type { ServerToClientEvents } from "../../shared-types";
import { graphCache, showOpenFile } from "../show-open-file";
import { Effect } from "effect";
import { Lang } from "@ast-grep/napi";
import type { CodeReference } from "../../ast/llm/llm.schema";

/**
 * a Singleton reference to the webview panel
 */
export const webviewPanelRef = {
	current: null as vscode.WebviewPanel | null,
};

/**
 * Post a message to the webview panel
 * @param message - The message to post
 */
export const postMessageToPanel = (message: ServerToClientEvents) =>
	webviewPanelRef.current?.webview.postMessage(JSON.stringify(message));

/**
 * Register the webview command
 * @param context - The extension context
 * @returns The command
 */
export function registerWebview(context: vscode.ExtensionContext) {
	// 📦 Register the webview serializer, to restore the webview on vscode restart
	vscode.window.registerWebviewPanelSerializer(
		"nodifyWebview",
		new NodifyWebviewSerializer(context),
	);

	// 📦 Register the command to open the webview
	const command = vscode.commands.registerCommand(
		"nodify.openWebview",
		(ref?: CodeReference) => {
			console.log("webview args", ref);
			graphCache.startingCodeReference = ref ?? null;
			// ⏭️ Return if a webview is already open
			if (webviewPanelRef.current) {
				webviewPanelRef.current.reveal(vscode.ViewColumn.Beside);
				Effect.runFork(
					showOpenFile(ref?.lang ? [ref.lang] : [Lang.Python, Lang.TypeScript]),
				);
				return;
			}

			// 🌱 Create a new Webview
			createWebview({ context, onClientMessage });
		},
	);

	return command;
}
