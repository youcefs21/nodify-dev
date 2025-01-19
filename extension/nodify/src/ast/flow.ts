import * as vscode from "vscode";
import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import { type FlowKind, flowKinds } from "./ast.schema";
import { handleExpression } from "./expressions";

export type Reference = {
	symbol: string;
	location: vscode.Location;
	file: vscode.Uri;
};

export type CodeBlock = {
	id: number;
	text: string;
	location: vscode.Range;
	file: vscode.Uri;
	references?: Reference[];
	children?: CodeBlock[];
};

export async function getAST(document: vscode.TextDocument) {
	const text = document.getText();
	const root = parse(Lang.Python, text).root();
	const flows = await handleFlows(root.children(), document);
	return flows;
}

async function handleNodeWithBlock(
	node: SgNode,
	id: number,
	replaceWith: string,
	document: vscode.TextDocument,
): Promise<CodeBlock> {
	const block = node.children().find((x) => x.kind() === "block");
	if (!block || block.kind() !== "block") {
		throw new Error("NoBlockFound");
	}

	const children = await handleFlows(block.children(), document);

	const edit = block.replace(replaceWith);
	const text = node.commitEdits([edit]);
	return {
		id,
		text,
		location: getRange(node),
		file: document.uri,
		children,
	};
}

function getRange(node: SgNode) {
	const raw_range = node.range();
	const range = new vscode.Range(
		new vscode.Position(raw_range.start.line, raw_range.start.column),
		new vscode.Position(raw_range.end.line, raw_range.end.column),
	);
	return range;
}

export async function handleFlow(
	node: SgNode,
	kind: FlowKind,
	id: number,
	document: vscode.TextDocument,
): Promise<CodeBlock> {
	switch (kind) {
		case "if_statement": {
			return handleNodeWithBlock(node, id, "<if_body/>", document);
		}

		case "for_statement": {
			return handleNodeWithBlock(node, id, "<for_body/>", document);
		}

		case "while_statement": {
			return handleNodeWithBlock(node, id, "<while_body/>", document);
		}

		case "expression_statement": {
			const children = node.children();
			if (children.length !== 1) {
				throw new Error("InvalidExpressionStatement");
			}
			const refs = await handleExpression(children[0], document);

			const location = getRange(node);
			if (refs.length === 0) {
				return { id, text: node.text(), location, file: document.uri };
			}

			return {
				id,
				text: node.text(),
				location,
				file: document.uri,
				references: refs,
			};
		}

		default: {
			console.log("unknown type: ", node.kind());
			throw new Error("Unknown Type");
		}
	}
}

export async function handleFlows(
	nodes: SgNode[],
	document: vscode.TextDocument,
) {
	const blocks: CodeBlock[] = [];

	for (let id = 0; id < nodes.length; id++) {
		const kind = nodes[id].kind();
		// handle flows
		if (flowKinds.some((flowKind) => flowKind === kind)) {
			blocks.push(await handleFlow(nodes[id], kind as FlowKind, id, document));
		}
	}

	return blocks;
}
