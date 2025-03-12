import { Effect } from "effect";
import type { ClientToServerEvents } from "../shared-types";
import { webviewPanelRef } from "./register-webview-command";
import * as vscode from "vscode";
import { showOpenPythonFile } from "./show-open-file";

type ClientEvent<T extends ClientToServerEvents["type"]> = Extract<
	ClientToServerEvents,
	{ type: T }
>;

function handleNodeToggle(message: ClientEvent<"node-toggle">) {
	return Effect.void;
}

function handleHighlightNodeSource(
	message: ClientEvent<"highlight-node-source">,
) {
	return Effect.void;
}

/**
 * Handles incoming messages from the webview client
 * @param message - The message from the webview client
 */
export function onClientMessage(message: ClientToServerEvents) {
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

			case "highlight-node-source": {
				yield* handleHighlightNodeSource(message);
				break;
			}
		}
	}).pipe(
		Effect.catchAll((error) => {
			vscode.window.showErrorMessage(error.message);
			console.error(error);
			return Effect.void;
		}),
		Effect.runFork,
	);
}
