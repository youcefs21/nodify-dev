import type * as vscode from "vscode";
import { getAST, type CodeBlock } from "../ast/flow";
import { runLLM } from "../llm";
import type { inputItem, inputList, LLMOutput } from "../types";
import { entryNode } from "../graph/NodeCreater";
import { readLLMCacheFromAST, writeLLMCache } from "../db/jsonDB";
import { getActiveHash, setActiveHash } from "./webview-command";
import { hashString } from "../db/hash";

function cleanAST(ast: CodeBlock[]): inputItem[] {
	// remove all children from the ast
	return ast.map((x) => ({
		id: x.id,
		text: x.text,
		children: cleanAST(x.children ?? []),
	}));
}

export async function analyzePythonDocument(
	document: vscode.TextDocument,
	context: vscode.ExtensionContext,
): Promise<LLMOutput[]> {
	const ast = await getAST(document);
	const input: inputList = {
		input: cleanAST(ast),
	};
	let { output, cacheFilePath } = await readLLMCacheFromAST(
		JSON.stringify(input.input),
	);

	if (!output) {
		console.warn(`File not found: ${cacheFilePath}`);

		output = await runLLM(input);
		if (output) {
			await writeLLMCache(cacheFilePath, output);
		}
	}
	await setActiveHash(context, cacheFilePath);

	return [
		{
			...entryNode,
			children: [
				{
					// biome-ignore lint/style/noNonNullAssertion: entryNode.children is not null
					...entryNode.children![0],
					children: output,
				},
			],
		},
	];
}
