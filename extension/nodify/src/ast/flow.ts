import * as vscode from "vscode";
import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import { type FlowKind, flowKinds } from "./ast.schema";
import fs from "node:fs";
import { handleExpression } from "./expressions";

export type Reference = {
	symbol: string;
	location: vscode.Location;
	file: vscode.Uri;
};

export type LLMBlock = {
	id: number;
	text: string;
	references?: Reference[];
	children?: LLMBlock[];
};

export function getAST(document: vscode.TextDocument) {
	const text = document.getText();
	const root = parse(Lang.Python, text).root();
	const flows = handleFlows(root.children(), document);
	// save the flows to a file
	const filePath = `${vscode.workspace.workspaceFolders?.[0]?.uri.fsPath}/flows.json`;
	console.log("saving flows to file: ", filePath);
	fs.writeFileSync(filePath, JSON.stringify(flows, null, 2));
	return flows;
}

function handleNodeWithBlock(
	node: SgNode,
	id: number,
	replaceWith: string,
	document: vscode.TextDocument,
): LLMBlock {
	const block = node.children().find((x) => x.kind() === "block");
	if (!block || block.kind() !== "block") {
		throw new Error("NoBlockFound");
	}

	const children = handleFlows(block.children(), document);

	const edit = block.replace(replaceWith);
	const text = node.commitEdits([edit]);
	return { id, text, children };
}

export function handleFlow(
	node: SgNode,
	kind: FlowKind,
	id: number,
	document: vscode.TextDocument,
): LLMBlock {
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
			const refs = handleExpression(children[0], document);

			if (refs.length === 0) {
				return { id, text: node.text() };
			}

			return { id, text: node.text(), references: refs };
		}

		default: {
			console.log("unknown type: ", node.kind());
			throw new Error("Unknown Type");
		}
	}
}

export function handleFlows(nodes: SgNode[], document: vscode.TextDocument) {
	const blocks: LLMBlock[] = [];

	for (let id = 0; id < nodes.length; id++) {
		const kind = nodes[id].kind();
		// handle flows
		if (flowKinds.some((flowKind) => flowKind === kind)) {
			blocks.push(handleFlow(nodes[id], kind as FlowKind, id, document));
		}
	}

	return blocks;
}
