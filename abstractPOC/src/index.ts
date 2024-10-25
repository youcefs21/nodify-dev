import { parse, Lang, kind, type SgNode } from "@ast-grep/napi";
import fs from "node:fs";
import { type FlowKind, flowKinds } from "./kinds";

const filePath = "PythonQuest/main.py";
const source = fs.readFileSync(filePath, "utf-8");
const ast = parse(Lang.Python, source);
const root = ast.root();

function handleFlow(node: SgNode, kind: FlowKind) {
	switch (kind) {
		case "if_statement": {
			const block = node.child(3);
			if (!block || block.kind() !== "block") throw "NoBlockFound";
			const children = block.children();
			console.log(children.map((x) => x.kind()));

			break;
		}
		case "expression_statement": {
			//
			break;
		}
		default:
			break;
	}
}

const rootChildren = root.children();
// console.log(new Set(rootChildren.map((x) => x.kind())));
const flow = rootChildren.filter((x) =>
	flowKinds.includes(x.kind() as FlowKind),
);

for (const f of flow) {
	// console.log(`children of ${f.kind()} are:`);
	// console.log(children.map((x) => x.text()));

	handleFlow(f, f.kind() as FlowKind);
}
