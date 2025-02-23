import * as vscode from "vscode";
import { handleFlows, type Reference, type CodeBlock } from "../ast/flow";
import { runLLM } from "../llm";
import type { inputItem, inputList, LLMOutput } from "../types";
import { entryNode } from "../graph/NodeCreater";
import { readLLMCacheFromAST, writeLLMCache } from "../db/jsonDB";
import { setActiveHash } from "./webview-command";
import { Lang, parse, type SgNode } from "@ast-grep/napi";

type AstLocationPosition = { line: number; character: number };
export type AstLocation = {
	id: number;
	// biome-ignore lint/suspicious/noExplicitAny: AbstractNodes.tsx only works with indexing on AstLocation, even though the expected type should be vscode.Range. Idk
	location: AstLocationPosition[] | any;
};
interface CleanedAST {
	llm_ast: inputItem[];
	ast_locations: AstLocation[];
}

function cleanAST(ast: CodeBlock[]): CleanedAST {
	// remove all children from the ast
	return {
		llm_ast: ast.map((x) => ({
			id: x.id,
			text: x.text,
			children: cleanAST(x.children ?? []).llm_ast,
		})),
		ast_locations: ast.flatMap((x) => {
			const locations = [
				{
					id: x.id,
					location: x.location,
				},
			];
			if (x.children) {
				return [...locations, ...cleanAST(x.children).ast_locations];
			}
			return locations;
		}),
	};
}

export async function findNodeFromRange(
	nodes: SgNode[],
	range: vscode.Range,
): Promise<SgNode[] | null> {
	for (const child of nodes) {
		const nodeRange = child.range();
		const childStart = new vscode.Position(
			nodeRange.start.line,
			nodeRange.start.column,
		);
		const childEnd = new vscode.Position(
			nodeRange.end.line,
			nodeRange.end.column,
		);
		const childVscRange = new vscode.Range(childStart, childEnd);

		if (childVscRange.contains(range)) {
			console.log(child.kind());
			const children = child.children();
			const foundInChildren = await findNodeFromRange(children, range);
			if (foundInChildren) {
				return foundInChildren;
			}
			return [child];
		}
	}
	return null;
}

export async function analyzePythonBlock(
	document: vscode.TextDocument,
	ref: Reference,
	context: vscode.ExtensionContext,
) {
	//
	const text = document.getText();
	const root = parse(Lang.Python, text).root();
	// const children = root.children();
	const nodes = root.find({
		rule: {
			range: {
				start: {
					line: ref.location.range.start.line,
					column: ref.location.range.start.character,
				},
				end: {
					line: ref.location.range.end.line,
					column: ref.location.range.end.character,
				},
			},
		},
	});
	const block = nodes?.children().find((x) => x.kind() === "block");
	console.log(block?.children().map((x) => x.text()));
	const ast = await handleFlows(block?.children() ?? [], document);
	console.log(ast);
	const { ast_locations, llm_ast } = cleanAST(ast);
	const input: inputList = {
		input: llm_ast,
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
	return { graph: output, ast_locations };
}

export async function analyzePythonDocument(
	document: vscode.TextDocument,
	context: vscode.ExtensionContext,
): Promise<{ graph: LLMOutput[]; ast_locations: AstLocation[] }> {
	const text = document.getText();
	const root = parse(Lang.Python, text).root();
	const ast = await handleFlows(root.children(), document);

	const { llm_ast, ast_locations } = cleanAST(ast);

	const input: inputList = {
		input: llm_ast,
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

	return {
		graph: [
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
		],
		ast_locations,
	};
}
