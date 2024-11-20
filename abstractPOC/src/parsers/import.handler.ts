import { parse, Lang, type SgNode, type SgRoot } from "@ast-grep/napi";
import fs from "node:fs";
import type { ImportKind } from "../types/ast.schema";
import type { Scope, ScopeItem } from "../types/graph.types";
import { handleFlows } from "./root.handler";
import path from "node:path";

interface ImportFileOutput {
	root: SgRoot | null;
	path: string;
	fileName: string;
}

export interface ThisModulePath {
	rootPath: string;
	currentPath: string;
	fileName: string;
}

function handleImportFile(
	module_name: string,
	thisModulePath: ThisModulePath,
): ImportFileOutput {
	// Try with thisModulePath first
	let file_path = path.join(
		thisModulePath.currentPath,
		`${module_name.replaceAll(".", "/")}.py`,
	);
	if (fs.existsSync(file_path)) {
		return {
			root: parse(Lang.Python, fs.readFileSync(file_path, "utf-8")),
			path: path.dirname(file_path),
			fileName: path.basename(file_path),
		};
	}

	// Try with rootPath
	file_path = path.join(
		thisModulePath.rootPath,
		`${module_name.replaceAll(".", "/")}.py`,
	);
	if (fs.existsSync(file_path)) {
		return {
			root: parse(Lang.Python, fs.readFileSync(file_path, "utf-8")),
			path: path.dirname(file_path),
			fileName: path.basename(file_path),
		};
	}

	return {
		root: null,
		path: "",
		fileName: "",
	};
}

function handleImportStatement(
	node: SgNode,
	scope: Scope,
	thisModulePath: ThisModulePath,
): void {
	const import_names = node
		.children()
		.filter((x) => x.text() !== "import")
		.filter((x) => x.text() !== ",")
		.map((x) => x.text());

	for (const name_maybe_as of import_names) {
		const name = name_maybe_as.split("as")[0].trim();
		const { root, path, fileName } = handleImportFile(name, thisModulePath);

		const imported_module: ScopeItem = {
			name: name,
			node: root,
			kind: "module",
		};

		if (name_maybe_as.includes("as")) {
			const alias_name = name_maybe_as.split("as")[1].trim();
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

function handleImportFromStatement(
	node: SgNode,
	scope: Scope,
	thisModulePath: ThisModulePath,
): void {
	const import_names = node
		.children()
		.filter((x) => x.text() !== "from")
		.filter((x) => x.text() !== "import")
		.filter((x) => x.text() !== ",")
		.map((x) => x.text());

	const module_name = import_names[0];
	const {
		root: file_root,
		path: file_path,
		fileName,
	} = handleImportFile(module_name, thisModulePath);
	if (!file_root) {
		console.warn(`[WARN] Module ${module_name} not found`);
		return;
	}
	const imported_file_flow = handleFlows(file_root.root().children(), {
		rootPath: thisModulePath.rootPath,
		currentPath: file_path,
		fileName,
	});

	for (const name_maybe_as of import_names.slice(1)) {
		const name = name_maybe_as.split("as")[0].trim();
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
			const display_name = name_maybe_as.split("as")[1].trim();
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

export function handleImport(
	node: SgNode,
	kind: ImportKind,
	scope: Scope,
	thisModulePath: ThisModulePath,
) {
	switch (kind) {
		case "import_statement": {
			return handleImportStatement(node, scope, thisModulePath);
		}

		case "import_from_statement": {
			return handleImportFromStatement(node, scope, thisModulePath);
		}

		case "future_import_statement": {
			throw new Error("future imports not supported (for now)");
		}

		default: {
			throw new Error(`Unknown Import Type: ${kind}`);
		}
	}
}
