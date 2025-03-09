import type { ClientToServerEvents } from "../shared-types";
import { webviewPanelRef } from "./register-webview-command";

/**
 * Handles incoming messages from the webview client
 * @param message - The message from the webview client
 */
export function onClientMessage(message: ClientToServerEvents) {
	const panel = webviewPanelRef.current;
	if (!panel) throw new Error("No webview panel found");

	console.log(message);
	switch (message.type) {
		case "on-render": {
			break;
		}

		case "node-toggle": {
			break;
		}

		case "highlight-node-source": {
			break;
		}
	}
}
