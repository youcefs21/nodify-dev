////////////////////////////////////////////////////////////
// Ast Grep Kinds

import { Schema } from "effect";

////////////////////////////////////////////////////////////
export const flowKinds = [
	"expression_statement",
	"if_statement",
	"for_statement",
	"while_statement",
	"try_statement",
	"elif_clause",
	"else_clause",
	"except_clause",
	"finally_clause",
	"return_statement",
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

export const ignoreKinds = [
	"=",
	// "identifier",
	"integer",
	"[",
	"]",
	"(",
	")",
	",",
	"lambda",
	":",
	// "lambda_parameters",
	"{",
	"}",
	"if",
	"else",
	"or",
	"not",
	"and",
	"==",
	"!=",
	"<",
	">",
	"<=",
	">=",
	"in",
	"not in",
	"is",
	"is not",
	"|",
	"^",
	"&",
	"<<",
	">>",
	"+",
	"-",
	"*",
	"/",
	"//",
	"%",
	"**",
	"true",
	"false",
	"await",
	"ellipsis",
	"string_content",
	"string_start",
	"string_end",
	"string",
	"for",
	"in",
	"int",
	"float",
	"+=",
	"-=",
	"*=",
	"/=",
	"//=",
	"%=",
	"**=",
	"&=",
	"|=",
	"^=",

	// maybe, check again later
	"pattern_list",
];
