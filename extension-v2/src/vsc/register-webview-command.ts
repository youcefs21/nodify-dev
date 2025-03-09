import * as vscode from "vscode";
import { createWebview } from "./create-webview";
import { NodifyWebviewSerializer } from "./webview-serializer";

/**
 * a Singleton reference to the webview panel
 */
export const webviewPanelRef = {
	current: null as vscode.WebviewPanel | null,
};

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
	const command = vscode.commands.registerCommand("nodify.openWebview", () => {
		// ⏭️ Return if a webview is already open
		if (webviewPanelRef.current) {
			return webviewPanelRef.current.reveal(vscode.ViewColumn.Beside);
		}

		// 🌱 Create a new Webview
		createWebview(context, (message) => {
			console.log(message);
		});
	});

	return command;
}
