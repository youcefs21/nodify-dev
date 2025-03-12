import type { ClientToServerEvents } from "../../../src/shared-types";
import { vscode } from "./vscode";

export const sendToServer = (message: ClientToServerEvents) => {
	// Send a message to the extension
	vscode.postMessage(message);
};
