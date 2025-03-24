import { Effect } from "effect";
import * as vscode from "vscode";

class NoTypeScriptExtensionError {
	readonly _tag = "NoTypeScriptExtensionError";
	readonly message =
		"Please install the TypeScript extension for full functionality.";
}

class NoTypeScriptServerError {
	readonly _tag = "NoTypeScriptServerError";
	readonly message =
		"Please install the TypeScript language server for full functionality.";
}

/**
 * Asserts that the TypeScript extension is installed and activated.
 * Also ensures the TypeScript extension is fully initialized by directly accessing its API.
 */
export function assertTypeScriptExtension(
	shouldActivateLanguageServer = false,
) {
	return Effect.gen(function* () {
		// 🔍 Get the TypeScript extension
		const extension = vscode.extensions.getExtension(
			"vscode.typescript-language-features",
		);

		// ❌ Fail if it's not installed
		if (!extension) return yield* Effect.fail(new NoTypeScriptExtensionError());

		// 🚀 Activate the extension if it's not active
		if (!extension.isActive) {
			yield* Effect.tryPromise(() => extension.activate());
		}

		// 🔗 Force TypeScript extension to fully initialize
		if (shouldActivateLanguageServer) {
			yield* activateLanguageServer();
		}

		return extension;
	});
}

/**
 * 🚀 Ensures TypeScript language server is fully activated
 *
 * Needed for LSP features like goto definition, references, etc.
 */
export function activateLanguageServer() {
	return Effect.gen(function* () {
		// 🔍 TypeScript - required for TypeScript language server functionality
		const typescriptExtension = vscode.extensions.getExtension(
			"vscode.typescript-language-features",
		);
		// ❌ Fail if it's not installed
		if (!typescriptExtension) {
			return yield* Effect.fail(new NoTypeScriptServerError());
		}

		// 🚀 Activate the extension if it's not active
		if (!typescriptExtension.isActive) {
			yield* Effect.tryPromise(() => typescriptExtension.activate());
		}

		// ⚙️ Direct LSP client initialization if API available
		if (typescriptExtension.exports?.client?.start) {
			yield* Effect.tryPromise(() =>
				typescriptExtension.exports.client.start(),
			);
		}

		return yield* Effect.succeed(null);
	});
}
