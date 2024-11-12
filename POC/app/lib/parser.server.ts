import * as fs from "node:fs";
import type { SgNode } from "@ast-grep/napi";
import JSONC from "comment-json";

interface NestedStuff {
	text: string;
	kind: string;
	children: NestedStuff[];
}

type Kinds =
	| "function_definition"
	| "expression_statement"
	| "comment"
	| "while_statement";

function getRecursiveStuff(node: SgNode): NestedStuff[] {
	// if (node.kind() === "while_statement") {
	// 	console.log(node.children().map((x) => x.kind()));
	// }
	// if there is a child with a block, just search that

	const block = node.children().filter((x) => x.kind() === "block");
	if (block.length > 0) {
		return getRecursiveStuff(block[0]);
	}

	return node
		.children()
		.map((x) => ({
			text: x.text(),
			kind: x.kind(),
			children: getRecursiveStuff(x),
		}))
		.filter((x) => {
			// console.log(x.kind)
			return x.kind !== "comment" && x.kind !== "import_statement";
		});
}

function processNode(node: SgNode) {
	switch (node.kind()) {
		case "comment": {
			const t = node.text();
			if (t.startsWith("## START ")) {
				const msg = t.slice(9);
				// console.log(msg);
			} else if (t.startsWith("## END")) {
				// console.log("block ended");
			}
			break;
		}
		// [`if`, `comparison`, `:`, `block`, ...else and elifs]
		case "if_statement": {
			const children = node.children();
			const comparison = children[1];
			const block = children[3];
			console.log(
				children[5].children().map((x) => ({ kind: x.kind(), text: x.text() })),
			);
			break;
		}
		// the else and elif blocks are the same as if,
		// [`elif`, `comparison`, `:`, `block`]
		// [`else`, `:`, `block`]
		// default:
		// 	console.log("unknown kind", node.kind());
	}
}

// I need to flatten the tree.

type JSONType = {
	nodes: {
		id: string;
		group_id: string | null;
		type: string;
		title: string;
		content?: string;
		order?: number;
	}[];
	edges: {
		from: string;
		to: string;
		label: string;
	}[];
};

export function parseStuff() {
	const content = fs.readFileSync("demo/snake.json", "utf-8");
	const json = JSONC.parse(content);

	return json as unknown as JSONType;
	// const ast = parse("Python" as Lang, content);

	// const root = ast.root();

	// for (const n of root.children()) {
	// 	processNode(n);
	// }
	// console.log(root.children().map((x) => ({ kind: x.kind(), text: x.text() })));
	// console.log;

	// return getRecursiveStuff(root).filter((x) => {
	// 	// console.log(x.kind)
	// 	return x.kind !== "comment" && x.kind !== "import_statement";
	// });
}
