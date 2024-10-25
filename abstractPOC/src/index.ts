import { parse, Lang, type SgNode } from "@ast-grep/napi";
import fs from "node:fs";
import { type FlowKind, flowKinds } from "./kinds";
import { LLMBlocks as LLMBlock } from "./llm";

const filePath = "PythonQuest/snake.py";
const source = fs.readFileSync(filePath, "utf-8");
const ast = parse(Lang.Python, source);
const root = ast.root();

export async function exportJson(filename: string, out: LLMBlock[]) {
	const jsonString = JSON.stringify(out, null, 2);
	filename = filename + ".json"
	try {
		// Write the JSON string to the specified file using Bun's write method
		await Bun.write("llmBlob/" + filename, jsonString);
		console.log(`JSON data has been written to ${filename}`);
	} catch (error) {
		console.error('Error writing JSON to file:', error);
		throw error; // Rethrow the error after logging
	}
}


function handleFlow(node: SgNode, kind: FlowKind, id: number): LLMBlock {
	switch (kind) {
		case "if_statement": {
			console.log("while children: ", node.children().map((x) => x.kind()))
			const block = node.child(3);
			if (!block || block.kind() !== "block") throw "NoBlockFound";

			const children = handleFlows(block.children());

			return { id, children, text: node.text() }
		}
		case "for_statement": {
			console.log("for children: ", node.children().map((x) => x.kind()))
			return { id, children: [], text: node.text() }
		}
		case "while_statement": {
			console.log("while children: ", node.children().map((x) => x.kind()))
			const block = node.child(3);
			if (!block || block.kind() !== "block") throw "NoBlockFound";

			const children = handleFlows(block.children());

			return { id, children, text: node.text() }
		}
		case "expression_statement": {
			return { id, children: [], text: node.text() }
		}
		default:
			console.log("unknown type: ", node.kind())
			throw new Error("Unknown Type")
	}
}

function handleFlows(nodes: SgNode[]): LLMBlock[] {
	const flow = nodes.filter((x) =>
		flowKinds.includes(x.kind() as FlowKind),
	);

	const output: LLMBlock[] = []
	for (let i = 0; i < flow.length; i++) {
		output.push(handleFlow(flow[i], flow[i].kind() as FlowKind, i));
	}

	return output
}

const rootOut = handleFlows(root.children())
await exportJson("root", rootOut)