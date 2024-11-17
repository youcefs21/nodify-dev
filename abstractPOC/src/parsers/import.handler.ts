import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import fs from "node:fs";
import type { ImportKind } from "../types/ast.schema";
import type { Scope, ScopeItem } from "../types/graph.types";
import { handleFlows } from "./root.handler";

function handleImportFile(module_name: string): SgRoot | null {
	const file_path = `${module_name.replaceAll(".", "/")}.py`;

	console.log("file_path", file_path);
	if (!fs.existsSync(file_path)) return null;
	return parse(Lang.Python, fs.readFileSync(file_path, "utf-8"));
}

function handleImportStatement(node: SgNode, scope: Scope): void {
	const import_names = node
		.children()
		.filter((x) => x.text() !== "import")
		.filter((x) => x.text() !== ",")
		.map((x) => x.text());

	for (const name_maybe_as of import_names) {
		const name = name_maybe_as.split("as")[0];
		const file_path = handleImportFile(name);

		const imported_module: ScopeItem = {
			name: name,
			node: file_path,
			kind: "module",
		};

		if (name_maybe_as.includes("as")) {
			const alias_name = name_maybe_as.split("as")[1];
			scope.push({
				name: alias_name,
				kind: "alias",
				node: imported_module,
			});
		} else {
			scope.push(imported_module);
		}
	}
}

function handleImportFromStatement(node: SgNode, scope: Scope): void {
	const import_names = node
		.children()
		.filter((x) => x.text() !== "from")
		.filter((x) => x.text() !== "import")
		.filter((x) => x.text() !== ",")
		.map((x) => x.text());

	const module_name = import_names[0];
	const file_root = handleImportFile(module_name);
	const imported_file_flow = handleFlows(file_root?.root().children() ?? []);

	for (const name_maybe_as of import_names.slice(1)) {
		const name = name_maybe_as.split("as")[0];
		const target = imported_file_flow.scope.findLast((x) => x.name === name);

		if (!target) {
			throw new Error(
				`Target ${name} not found in imported file ${module_name}`,
			);
		}

		const imported_item: ScopeItem = {
			...target,
			name: name,
		};

		if (name_maybe_as.includes("as")) {
			const display_name = name_maybe_as.split("as")[1];
			scope.push({
				name: display_name,
				kind: "alias",
				node: imported_item,
			});
		} else {
			scope.push(imported_item);
		}
	}
}

export function handleImport(node: SgNode, kind: ImportKind, scope: Scope) {
	switch (kind) {
		case "import_statement": {
			return handleImportStatement(node, scope);
		}

		case "import_from_statement": {
			return handleImportFromStatement(node, scope);
		}

		case "future_import_statement": {
			throw new Error("future imports not supported (for now)");
		}

		default: {
			throw new Error(`Unknown Import Type: ${kind}`);
		}
	}
}
