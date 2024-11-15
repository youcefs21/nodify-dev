import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import fs from "node:fs";
import type { ImportKind } from "../types/ast.schema";
import type { Scope, ScopeItem } from "./handlers";

function handleImportFile(module_name: string): SgRoot | null {
	const file_path = module_name.replaceAll(".", "/");

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
	const file_path = handleImportFile(module_name);
	const module_item: ScopeItem = {
		name: module_name,
		node: file_path,
		kind: "module",
	};

	for (const name_maybe_as of import_names.slice(1)) {
		const name = name_maybe_as.split("as")[0];
		// TODO this isn't great, we should be reading the module for the "name", and setting the kind accordingly
		const imported_item: ScopeItem = {
			name: name,
			kind: "function", // Func for now, could be class/var but doesn't really matter
			node: module_item,
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
