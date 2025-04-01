import vscode from "vscode";
import OpenAI from "openai";

// const OPENAI_URL = "http://100.89.180.124:6969";
// const OPENAI_URL = "http://127.0.0.1:11434";
// const model = "unsloth/phi-4-bnb-4bit";
// const model = "phi4:14b-q8_0";
export const SHOULD_USE_MOCK = true;
const apiKey = process.env.OPENAI_API_KEY ?? "";

export function getModelFromWorkspaceConfig() {
	const config = vscode.workspace.getConfiguration("nodify");
	// No default defined here, instead define it in package.json
	const model_id = config.get<string>("LLMModelID");
	if (!model_id) {
		console.error(
			"No model ID found in workspace config. Defaulting to gpt-4o-mini",
		);
		return "gpt-4o-mini";
	}
	return model_id;
}

export function getOpenAIClientFromWorkspaceConfig() {
	const config = vscode.workspace.getConfiguration("nodify");
	// fallback to openai server
	const server_ip = config.get<string>("LLMServerIP");

	if (!server_ip) {
		return new OpenAI({
			apiKey: apiKey,
		});
	}
	return new OpenAI({
		baseURL: `${server_ip}/v1`,
		apiKey: apiKey,
	});
}
