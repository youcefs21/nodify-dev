import { parse, Lang, kind } from "@ast-grep/napi";
import fs from "node:fs";
import { type FlowKind, flowKinds } from "./kinds";

const filePath = "PythonQuest/main.py";
const source = fs.readFileSync(filePath, "utf-8");
const ast = parse(Lang.Python, source);
const root = ast.root();

const rootChildren = root.children();
// console.log(new Set(rootChildren.map((x) => x.kind())));
const flow = rootChildren.filter((x) =>
	flowKinds.includes(x.kind() as FlowKind),
);

for (const f of flow) {
	const children = f.children();
	console.log(`children of ${f.kind()} are:`);
	console.log(children.map((x) => x.kind()));
}
