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
import { isFunc, isVar } from "../types/graph.types";

// const filePath = "PythonQuest/definition_test.py";
// const source = fs.readFileSync(filePath, "utf-8");
// const ast = parse(Lang.Python, source);
// const root = ast.root();

function parseLocation(node: SgNode): Location {
	return {
		start: node.range().start,
		end: node.range().end,
		file: node.getRoot().filename(),
	};
}

function parseDefinitions(
	unfiltered_children: SgNode[],
	id: number,
): InModuleDef[] {
	// if (node.kind() === "module") {
	// 	return parseModule(node, id);
	// }
	let in_module_defs: InModuleDef[] = [];
	// const children = node.children();
	const children = unfiltered_children.filter((x) => x.kind() !== "comment");

	for (let i = 0; i < children.length; i++) {
		id++;
		console.log("Parsing kind:", children[i].kind());

		switch (children[i].kind()) {
			case "expression_statement": {
				if (children[i].children().length !== 1) {
					continue;
				}
				let possible_docstr = undefined;
				if (
					children[i].children()[0].kind() === "string" &&
					i < children.length - 1 &&
					children[i + 1].kind() === "expression_statement"
				) {
					possible_docstr = children[i].children()[0];
					i++;
				}
				//assert(node.children().length === 1);
				// many vars may be defined on one line
				in_module_defs = in_module_defs.concat(
					parseVar(children[i].children()[0], id, possible_docstr),
				);
				// console.dir(in_module_defs[in_module_defs.length - 1], { depth: null });
				break;
			}
			// case "decorated_definition": // commenting out for now since decorated definitions contain both funcs and classes ( need to separate them out here)
			case "function_definition":
				in_module_defs.push(parseFunction(children[i], id));
				// console.dir(in_module_defs[in_module_defs.length - 1], { depth: null });
				break;
			case "class_definition":
				in_module_defs.push(parseClass(children[i], id));
				break;
			default:
				console.log("Passing on kind:", children[i].kind());
			// throw new Error(`Unknown kind: ${children[i].kind()}`);
		}
	}
	return in_module_defs;
}

function determineIdentifierPrivacy(name: string): Privacy {
	if (name.startsWith("_")) {
		return "hidden";
	}
	if (name.startsWith("__")) {
		return "private";
	}
	return "public";
}

function parseVar(node: SgNode, id: number, possible_docstr?: SgNode): Var[] {
	// assert(node.kind() === "expression_statement");
	console.log(node.children().map((x) => x.kind()));
	console.log(node.text());

	switch (node.kind()) {
		case "augmented_assignment":
		case "assignment": {
			let pointer = 0;
			let vars = [];
			const multi_assign_list = [
				"pattern_list",
				"list_pattern",
				"tuple_pattern",
			];
			if (node.children()[pointer].kind() === "identifier") {
				const name = node.children()[pointer].text();
				pointer++;

				let type = null;
				if (node.children()[pointer].kind() === ":") {
					pointer++;
					type = node.children()[pointer].text();
					pointer++;
				}

				vars.push({
					name,
					type,
					value: null,
					docstr: null,
					privacy: determineIdentifierPrivacy(name),
				});
			} else if (multi_assign_list.includes(node.children()[pointer].kind())) {
				for (const child of node.children()[pointer].children()) {
					if (child.kind() === ",") {
						continue;
					}
					const name = child.text();

					vars.push({
						name,
						type: null,
						value: null,
						docstr: null,
						privacy: determineIdentifierPrivacy(name),
					});
				}
				pointer++;
			}

			let value = null;
			let other_assignments: Var[] = [];
			if (node.children()[pointer].kind() === "=") {
				pointer++;
				value = node.children()[pointer];
				if (value.kind() === "assignment") {
					other_assignments = parseVar(value, id, possible_docstr);
					value = other_assignments[0].value;
				} else {
					value = value.text();
				}
			}
			let docstr = null;
			if (possible_docstr) {
				docstr = possible_docstr.children()[1].text();
			}

			vars = vars
				.map((x) => ({ ...x, value, docstr }))
				.concat(other_assignments);

			// Very naive pattern list value assignment, doesnt really work for anything other than a,b=1,2
			// console.log(vars);
			// if (value !== null && value.split(",").length === vars.length) {
			// 	const split_values = value.split(",");
			// 	for (let i = 0; i < vars.length; i++) {
			// 		vars[i].value = split_values[i];
			// 	}
			// }
			// console.log(vars);
			return vars;
		}

		default:
			console.log("Passing on kind:", node.kind());
			return [];

		// throw new Error(`Unknown kind: ${node.kind()}, ${node.text()}`);
	}
}
function parseArgs(node: SgNode, id: number): Args {
	// assert(node.kind() === "parameters");
	// console.log(node.children().map((x) => x.kind()));
	const ignore = ["(", ")", ","];
	const argNodes = node.children().filter((x) => !ignore.includes(x.kind()));
	let pos_only_args: Var[] = [];
	let pos_or_kw_args: Var[] = [];
	let kw_only_args: Var[] = [];
	let pos_remainder_arg: Var | null = null;
	let kw_remainder_arg: Var | null = null;

	let current_args: Var[] = [];
	let keyword_sep_seen = false;
	for (const argNode of argNodes) {
		if (argNode.kind() === "positional_separator") {
			pos_only_args = current_args.slice();
			current_args = [];
			continue;
		}
		if (argNode.kind() === "keyword_separator") {
			pos_or_kw_args = current_args.slice();
			current_args = [];
			keyword_sep_seen = true;
			continue;
		}
		if (argNode.kind() === "list_splat_pattern") {
			pos_remainder_arg = {
				name: argNode.children()[1].text(),
				type: null,
				value: null,
				docstr: null,
				privacy: "public",
			};
			continue;
		}
		if (argNode.kind() === "dictionary_splat_pattern") {
			kw_remainder_arg = {
				name: argNode.children()[1].text(),
				type: null,
				value: null,
				docstr: null,
				privacy: "public",
			};
			continue;
		}

		let name = argNode.text();
		let type = null;
		let value = null;
		if (
			argNode.kind() === "typed_parameter" ||
			argNode.kind() === "typed_default_parameter"
		) {
			name = argNode.children()[0].text();
			type = argNode.children()[2].text();
		}
		if (argNode.kind() === "typed_default_parameter") {
			value = argNode.children()[4].text();
		}

		current_args.push({
			name,
			type,
			value,
			docstr: null,
			privacy: determineIdentifierPrivacy(name),
		});
	}

	if (keyword_sep_seen) {
		kw_only_args = current_args.slice();
	} else {
		pos_or_kw_args = current_args.slice();
	}

	return {
		pos_only_args,
		pos_or_kw_args,
		kw_only_args,
		pos_remainder_arg,
		kw_remainder_arg,
	};
}

function parseFunction(node: SgNode, id: number): Func {
	// assert(node.kind() === "function_definition");
	// console.log(node.children().map((x) => x.kind()));
	const location = parseLocation(node);
	let pointer = 0;

	// Handle decorators
	// TODO make this a reference?
	const decorator_list = [];
	while (node.children()[pointer].kind() === "decorator") {
		decorator_list.push(node.children()[pointer].children()[1].text());
		pointer++;
	}

	if (node.children()[pointer].kind() === "function_definition") {
		return {
			...parseFunction(node.children()[pointer], id),
			decorators: decorator_list,
		};
	}

	// Handle the actual function
	let modifier: "async" | null = null;
	if (node.children()[pointer].kind() === "async") {
		modifier = "async";
		pointer++;
	}
	pointer++; // skip "def"
	const name = node.children()[pointer].text();
	pointer++;
	const args = parseArgs(node.children()[pointer], id);
	// const args = null;
	pointer++;
	let return_type = null;
	if (node.children()[pointer].kind() === "->") {
		pointer++;
		return_type = node.children()[pointer].text();
		pointer++;
	}
	pointer++;
	const body = node.children()[pointer];

	let docstr = null;
	if (
		body.children()[0].kind() === "expression_statement" &&
		body.children()[0].children()[0].kind() === "string"
	) {
		docstr = body.children()[0].children()[0].children()[1].text();
	}

	return {
		id,
		location,
		name,
		return_type,
		args,
		decorators: decorator_list,
		modifier,
		docstr,
		body,
	};
}
function parseClass(node: SgNode, id: number): Class {
	// assert(node.kind() === "class_definition");
	// console.log(node.children().map((x) => x.kind()));
	const location = parseLocation(node);
	const name = node.children()[1].text();
	const class_args = parseArgs(node.children()[2], id);
	const bases = class_args.pos_only_args.map((x) => x.name);
	const privacy = determineIdentifierPrivacy(name);
	let kind: ClassKind = "concrete";

	// very naive check for abstract classes - breaks if someone aliases the name
	// leave mostly as a placeholder for now
	if (bases.includes("ABC")) {
		kind = "abstract";
	}
	let body_children = node.children()[node.children().length - 1].children();
	let docstr = null;
	if (
		body_children[0].kind() === "expression_statement" &&
		body_children[0].children()[0].kind() === "string"
	) {
		docstr = body_children[0].children()[0].children()[1].text();
		body_children = body_children.slice(1);
	}
	const in_class_defs = parseDefinitions(body_children, id);
	const class_vars = in_class_defs.filter(isVar);
	const future_methods = in_class_defs.filter(isFunc);
	const methods: Method[] = [];
	for (const method of future_methods) {
		methods.push({
			...method,
			privacy: determineIdentifierPrivacy(method.name),
			kind: ["instance"], //for now, just leave as-is until we get decorators working
		});
	}

	return {
		id,
		location,
		name,
		privacy,
		kind,
		bases,
		decorators: [],
		methods,
		class_vars,
		instance_vars: [], // Leave empty for now since this requires looking inside the init func
		docstr,
	};
}
function parseModule(node: SgNode, id: number): Module {
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

// parseModule(root, 0);
export {
	parseArgs,
	parseDefinitions,
	parseFunction,
	parseClass,
	parseModule,
	parseVar,
};
