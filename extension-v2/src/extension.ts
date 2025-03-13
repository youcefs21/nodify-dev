import { Effect } from "effect";
import * as vscode from "vscode";
import { assertPythonExtension } from "./vsc/assert-python-extension";
import { registerWebview } from "./vsc/webview/register-webview-command";
import { initDB } from "./db/jsonDB";

/**
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
	const main = Effect.gen(function* () {
		// Assert that the Python extension is installed and activated
		yield* assertPythonExtension(true);

		// Initialize the database
		yield* initDB();

		// Initialize the commands
		const webviewCommand = registerWebview(context);

		// Add the commands to the context
		context.subscriptions.push(webviewCommand);
	}).pipe(
		Effect.catchAll((error) => {
			vscode.window.showErrorMessage(error.message);
			console.error(error);
			return Effect.void;
		}),
	);

	await Effect.runPromiseExit(main);
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
	//
}
