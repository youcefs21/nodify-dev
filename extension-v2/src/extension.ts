import { Effect } from "effect";
import * as vscode from "vscode";
import { assertPythonExtension } from "./vsc/assert-python-extension";
import { registerWebview } from "./vsc/webview/register-webview-command";
import { initDB } from "./db/jsonDB";
import {
	registerLLMModelIDSelection,
	registerLLMServerIPSelection,
} from "./vsc/commands/llm-setting";
import { registerCursorPositionListener } from "./vsc/commands/cursor-position";
import { registerCodeLensProvider } from "./vsc/commands/codelens";

/**
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
	const main = Effect.gen(function* () {
		// Assert that the Python extension is installed and activated
		yield* assertPythonExtension(true);

		// Initialize the database
		yield* initDB();

		// Add the commands to the context
		context.subscriptions.push(
			registerWebview(context),
			registerLLMServerIPSelection(context),
			registerLLMModelIDSelection(context),
			// registerCodeLensProvider(context),
			// registerCursorPositionListener(),
		);
	}).pipe(
		Effect.catchAll((error) => {
			vscode.window.showErrorMessage(
				`[ERROR - ${error._tag}] ${error.message}`,
			);
			console.error(error);
			return Effect.void;
		}),
		Effect.catchAllDefect((error) => {
			vscode.window.showErrorMessage(`DEFECT: ${error}`);
			console.error("DEFECT: ", error);
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
