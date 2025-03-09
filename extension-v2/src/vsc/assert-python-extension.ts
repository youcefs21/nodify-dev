import { Effect } from "effect";
import * as vscode from "vscode";

class NoPythonExtensionError {
	readonly _tag = "NoPythonExtensionError";
	readonly message =
		"Please install the Python extension for full functionality.";
}

/**
 * Asserts that the Python extension is installed and activated.
 */
export function assertPythonExtension() {
	return Effect.gen(function* () {
		// 🔍 Get the Python extension
		const extension = vscode.extensions.getExtension("ms-python.python");

		// ❌ Fail if it's not installed
		if (!extension) return Effect.fail(new NoPythonExtensionError());

		// 🚀 Activate the extension if it's not active
		if (!extension.isActive) {
			yield* Effect.tryPromise(() => extension.activate());
		}
	});
}
