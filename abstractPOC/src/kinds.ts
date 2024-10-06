export const flowKinds = [
	"expression_statement",
	"if_statement",
	"for_statement",
	"while_statement",
] as const;
export type FlowKind = (typeof flowKinds)[number];

export const importKinds = [
	// different types of imports
	"import_statement",
	"import_from_statement",
	"future_import_statement",
] as const;
export type ImportKind = (typeof importKinds)[number];

export const definitionKinds = [
	"function_definition",
	"decorated_definition",
	"class_definition",
] as const;
export type DefinitionKind = (typeof definitionKinds)[number];

export const kinds = [
	"comment",
	...importKinds,
	...definitionKinds,
	...flowKinds,
] as const;
export type Kind = (typeof kinds)[number];

export const astSchema = {
	module: [
		"comment",
		"future_import_statement",
		"import_statement",
		"if_statement",
	],
	future_import_statement: ["from", "__future__", "import", "dotted_name"],
	import_statement: ["import", "dotted_name"],
	if_statement: [
		"if",
		"boolean_operator",
		":",
		"comment",
		"block",
		"comparison_operator",
	],
	dotted_name: ["identifier", "."],
	boolean_operator: ["comparison_operator", "and", "not_operator"],
	block: ["import_statement", "expression_statement"],
	comparison_operator: ["identifier", "==", "string", "is", "none"],
	not_operator: ["not", "call"],
	expression_statement: ["assignment", "call"],
	string: ["string_start", "string_content", "string_end"],
	call: ["identifier", "argument_list", "attribute"],
	assignment: ["identifier", "=", "call"],
	argument_list: ["(", "identifier", ",", "string", ")", "integer", "call"],
	attribute: ["attribute", ".", "identifier"],
};
