import type { SgNode } from "@ast-grep/napi";
import type {
	Location,
	Privacy,
	Var,
	Args,
	Func,
	Method,
	Class,
	ClassKind,
	InModuleDef,
	Module,
} from "../types/graph.types";
import { parseDefinitions } from "./definitions.handler";

export function parseLocation(node: SgNode): Location {
	return {
		start: node.range().start,
		end: node.range().end,
		filename: node.getRoot().filename(),
	};
}

export function parseModule(node: SgNode, id: number): Module {
	// assert(node.kind() === "module");
	const location = parseLocation(node);
	let body_children = node.children();
	let docstr = null;
	if (
		body_children[0].kind() === "expression_statement" &&
		body_children[0].children()[0].kind() === "string"
	) {
		docstr = body_children[0].children()[0].children()[1].text();
		body_children = body_children.slice(1);
	}
	const definitions = parseDefinitions(body_children, id);
	return {
		id,
		location,
		definitions,
		docstr,
	};
}
