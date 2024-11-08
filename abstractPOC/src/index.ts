import { parse, Lang, type SgNode } from "@ast-grep/napi";
import fs from "node:fs";
import { type FlowKind, flowKinds } from "./types/ast.schema";
import type { LLMBlock } from "./types/llm.types";
import { exportJson } from "./utils/exportJson";

const filePath = "PythonQuest/snake.py";
const source = fs.readFileSync(filePath, "utf-8");
const ast = parse(Lang.Python, source);
const root = ast.root();

function handleFlow(node: SgNode, kind: FlowKind, id: number): LLMBlock {
	switch (kind) {
		case "if_statement": {
			const block = node.children().find((x) => x.kind() === "block");
			if (!block || block.kind() !== "block") {
				throw "NoBlockFound";
			}

			const children = handleFlows(block.children());

			const edit = block.replace("<if_body/>");
			const text = node.commitEdits([edit]);
			return { id, text, children };
		}
		case "for_statement": {
			const block = node.children().find((x) => x.kind() === "block");
			if (!block || block.kind() !== "block") {
				throw "NoBlockFound";
			}

			const children = handleFlows(block.children());

			const edit = block.replace("<for_body/>");
			const text = node.commitEdits([edit]);
			return { id, text, children };
		}
		case "while_statement": {
			const block = node.children().find((x) => x.kind() === "block");
			if (!block || block.kind() !== "block") {
				throw "NoBlockFound";
			}

			const children = handleFlows(block.children());

			const edit = block.replace("<while_body/>");
			const text = node.commitEdits([edit]);
			return { id, text, children };
		}
		case "expression_statement": {
			return { id, text: node.text() };
		}
		default:
			console.log("unknown type: ", node.kind());
			throw new Error("Unknown Type");
	}
}

function handleFlows(nodes: SgNode[]): LLMBlock[] {
	const flow = nodes.filter((x) => flowKinds.includes(x.kind() as FlowKind));

	const output: LLMBlock[] = [];
	for (let i = 0; i < flow.length; i++) {
		output.push(handleFlow(flow[i], flow[i].kind() as FlowKind, i));
	}

	return output;
}

const rootOut = handleFlows(root.children());
await exportJson("root", rootOut);
