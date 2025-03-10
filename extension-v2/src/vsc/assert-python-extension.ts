import { Effect } from "effect";
import * as vscode from "vscode";

class NoPythonExtensionError {
	readonly _tag = "NoPythonExtensionError";
	readonly message =
		"Please install the Python extension for full functionality.";
}

class NoPylanceExtensionError {
	readonly _tag = "NoPylanceExtensionError";
	readonly message =
		"Please install the Pylance extension for full functionality.";
}

/**
 * Asserts that the Python extension is installed and activated.
 * Also ensures the Python extension is fully initialized by directly accessing its API.
 */
export function assertPythonExtension(shouldActivateLanguageServer = false) {
	return Effect.gen(function* () {
		// 🔍 Get the Python extension
		const extension = vscode.extensions.getExtension("ms-python.python");

		// ❌ Fail if it's not installed
		if (!extension) return yield* Effect.fail(new NoPythonExtensionError());

		// 🚀 Activate the extension if it's not active
		if (!extension.isActive) {
			yield* Effect.tryPromise(() => extension.activate());
		}

		// 🔗 Force Python extension to fully initialize
		if (shouldActivateLanguageServer) {
			yield* activateLanguageServer();
		}

		return extension;
	});
}

/**
 * 🚀 Ensures Python language server is fully activated
 *
 * Needed for LSP features like goto definition, references, etc.
 */
export function activateLanguageServer() {
	return Effect.gen(function* () {
		// 🔍 Pylance - required for Python language server functionality
		const pylanceExtension = vscode.extensions.getExtension(
			"ms-python.vscode-pylance",
		);
		// ❌ Fail if it's not installed
		if (!pylanceExtension) {
			return yield* Effect.fail(new NoPylanceExtensionError());
		}

		// 🚀 Activate the extension if it's not active
		if (!pylanceExtension.isActive) {
			yield* Effect.tryPromise(() => pylanceExtension.activate());
		}

		// ⚙️ Direct LSP client initialization if API available
		if (pylanceExtension.exports?.client?.start) {
			yield* Effect.tryPromise(() => pylanceExtension.exports.client.start());
		}

		return yield* Effect.succeed(null);
	});
}
