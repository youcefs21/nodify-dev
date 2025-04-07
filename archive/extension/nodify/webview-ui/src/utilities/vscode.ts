import type { WebviewApi } from "vscode-webview";

/**
 * A utility wrapper around the acquireVsCodeApi() function, which enables
 * communication between the webview and extension context.
 *
 * @see https://code.visualstudio.com/api/references/vscode-api#window.createWebviewPanel
 */
class VSCodeAPIWrapper {
	private readonly vsCodeApi: WebviewApi<unknown> | undefined;

	constructor() {
		// Check if the acquireVsCodeApi function exists in the current context
		if (typeof acquireVsCodeApi === "function") {
			this.vsCodeApi = acquireVsCodeApi();
		}
	}

	/**
	 * Posts a message to the extension context.
	 * @param message The message to post to the extension context.
	 */
	public postMessage(message: unknown) {
		if (this.vsCodeApi) {
			this.vsCodeApi.postMessage(message);
		}
	}

	/**
	 * Gets the persistent state stored for this webview.
	 * @returns The current state or undefined if no state has been set.
	 */
	public getState(): unknown | undefined {
		if (this.vsCodeApi) {
			return this.vsCodeApi.getState();
		}
		return undefined;
	}

	/**
	 * Sets the persistent state stored for this webview.
	 * @param newState The new state to set.
	 */
	public setState(newState: unknown) {
		if (this.vsCodeApi) {
			this.vsCodeApi.setState(newState);
		}
	}
}

export const vscode = new VSCodeAPIWrapper();
