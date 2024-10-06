import { parse, Lang, type SgNode } from "@ast-grep/napi";
import fs from "node:fs";

const filePath = "youtube_dl/__main__.py";
const source = fs.readFileSync(filePath, "utf-8");
const ast = parse(Lang.Python, source);
const root = ast.root();

const generateAstSchema = (node: SgNode) => {
	const schema = {} as Record<string, string[]>;
	const queue = [node];

	while (queue.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const currentNode = queue.shift()!;
		const kind = currentNode.kind();

		if (!schema[kind]) {
			schema[kind] = [];
		}

		const childrenKinds = currentNode.children().map((child) => child.kind());
		schema[kind] = Array.from(new Set([...schema[kind], ...childrenKinds]));

		queue.push(...currentNode.children());
	}

	// Exclude nodes with empty lists
	// biome-ignore lint/complexity/noForEach: <explanation>
	Object.keys(schema).forEach((key) => {
		if (schema[key].length === 0) {
			delete schema[key];
		}
	});

	return schema;
};

const astSchema = generateAstSchema(root);

fs.writeFileSync("astSchema.json", JSON.stringify(astSchema, null, 2));
