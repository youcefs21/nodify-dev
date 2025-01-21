import type { ClientToServerEvents } from "@nodify/schema";
import { vscode } from "../utilities/vscode";

export const sendToServer = (message: ClientToServerEvents) => {
	// Send a message to the extension
	vscode.postMessage(message);
};
