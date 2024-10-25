import { parse, Lang, type SgNode } from "@ast-grep/napi";
import fs from "node:fs";

const generateAstSchema = (roots: SgNode[]) => {
	const schema = {} as Record<string, string[]>;
	const queue = [...roots];

	while (queue.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const currentNode = queue.shift()!;
		const kind = currentNode.kind();

		if (kind === "augmented_assignment") {
			console.log(currentNode.text());
		}

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

const quest_source = fs.readFileSync("PythonQuest/main.py", "utf-8");
const quest_ast = parse(Lang.Python, quest_source);
const quest_root = quest_ast.root();

const astSchema = generateAstSchema([quest_root]);

fs.writeFileSync("astSchema.json", JSON.stringify(astSchema, null, 2));
