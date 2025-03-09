import { Effect } from "effect";
import type * as vscode from "vscode";
import { assertPythonExtension } from "./vsc/assert-python-extension";
import { registerWebview } from "./vsc/register-webview-command";

/**
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
	const main = Effect.gen(function* () {
		// Assert that the Python extension is installed and activated
		yield* assertPythonExtension();

		// Initialize the commands
		const webviewCommand = registerWebview(context);

		// Add the commands to the context
		context.subscriptions.push(webviewCommand);
	});

	await Effect.runPromiseExit(main);
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
	//
}
