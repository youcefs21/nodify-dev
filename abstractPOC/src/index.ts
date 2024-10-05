import { parse, Lang, kind } from "@ast-grep/napi";
import fs from "node:fs";
import { type FlowKind, flowKinds } from "./kinds";

const filePath = "PythonQuest/main.py";
const source = fs.readFileSync(filePath, "utf-8");
const ast = parse(Lang.Python, source);
const root = ast.root();

const children = root.children();
// console.log(new Set(children.map((x) => x.kind())));
const flow = children.filter((x) => flowKinds.includes(x.kind() as FlowKind));

console.log(flow.map((x) => x.kind()));
