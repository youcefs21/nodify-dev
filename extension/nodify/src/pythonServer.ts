import * as vscode from "vscode";
import { getAST, type CodeBlock } from "./ast/flow";
import fs from "node:fs";
import { runLLM } from "./llm";
import type { inputItem, inputList, LLMOutput } from "@nodify/schema";
import { entryNode } from "./graph/NodeCreater";

function cleanAST(ast: CodeBlock[]): inputItem[] {
	// remove all children from the ast
	return ast.map((x) => ({
		id: x.id,
		text: x.text,
		children: cleanAST(x.children ?? []),
	}));
}

export async function analyzePythonAST(document: vscode.TextDocument) {
	const ast = await getAST(document);
	const input: inputList = {
		input: cleanAST(ast),
	};
	const filePath = `${vscode.workspace.workspaceFolders?.[0]?.uri.fsPath}/flows.json`;
	let output: LLMOutput[] | undefined = undefined;
	if (fs.existsSync(filePath)) {
		const file = fs.readFileSync(filePath, { encoding: "utf8" });
		output = JSON.parse(file);
	} else {
		console.warn(`File not found: ${filePath}`);

		const output = await runLLM(input);
		console.log("ast: ", ast);
		// save the flows to a file
		console.log("saving flows to file: ", filePath);
		// TODO: try reading the file first before even trying to analyze the AST
		fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
	}

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
