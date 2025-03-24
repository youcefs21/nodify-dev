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
	"else_clause",
	"return_statement",
	"block",
	"statement_block",
	"switch_statement",
	"case_statement",
	"default_clause",
	"lexical_declaration",
	"await_expression",
] as const;
export type FlowKind = (typeof flowKinds)[number];

export const importKinds = [
	// different types of imports
	"import_statement",
	"import_declaration",
	"import_clause",
	"namespace_import",
	"named_imports",
] as const;
export type ImportKind = (typeof importKinds)[number];

export const definitionKinds = [
	"function_declaration",
	"class_declaration",
	"method_definition",
	"arrow_function",
	"generator_function",
	"variable_declaration",
	"variable_declarator",
	"export_statement",
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
	"identifier",
	"number",
	"[",
	"]",
	"(",
	")",
	",",
	"=>",
	":",
	"parameter_list",
	"formal_parameters",
	"required_parameter",
	"{",
	"}",
	"if",
	"else",
	"||",
	"!",
	"&&",
	"==",
	"===",
	"!=",
	"!==",
	"<",
	">",
	"<=",
	">=",
	"in",
	"|",
	"^",
	"&",
	"<<",
	">>",
	"+",
	"-",
	"*",
	"/",
	"%",
	"**",
	"true",
	"false",
	"await",
	"async",
	"function",
	"string_fragment",
	"string",
	"template_string",
	"for",
	"const",
	"let",
	"var",
	"+=",
	"-=",
	"*=",
	"/=",
	"%=",
	"**=",
	"&=",
	"|=",
	"^=",
	"++",
	"--",
	"export",
	"default",
	"extends",
	"implements",
	"as",
	"from",
	".",
	"type_annotation",
	"nested_type_identifier",
	"type_identifier",
	"yield",
];

////////////////////////////////////////////////////////////
// Output Types
////////////////////////////////////////////////////////////

export type CodeReference = {
	symbol: string;
	id: string;
	fullHash: string;
	body: string;
	range: CodeRange;
	filePath: string;
};

export type CodePosition = {
	line: number;
	character: number;
};

export type CodeRange = {
	start: CodePosition;
	end: CodePosition;
};

export type CodeBlock = {
	id: string;
	text: string;
	range: CodeRange;
	filePath: string;
	children?: CodeBlock[];
	references?: CodeReference[];
};

////////////////////////////////////////////////////////////
// LLM Code Reference Schema
////////////////////////////////////////////////////////////
const LLMCodeReferenceSchema = Schema.Struct({
	symbol: Schema.String,
	id: Schema.String,
});

interface LLMCodeBlock {
	readonly id: string;
	readonly text: string;
	readonly children?: ReadonlyArray<LLMCodeBlock>;
	readonly references?: ReadonlyArray<typeof LLMCodeReferenceSchema.Type>;
}

export const LLMCodeBlockSchema = Schema.Struct({
	id: Schema.String,
	text: Schema.String,
	children: Schema.suspend(
		(): Schema.Schema<LLMCodeBlock> => LLMCodeBlockSchema,
	).pipe(Schema.Array, Schema.optional),
	references: LLMCodeReferenceSchema.pipe(Schema.Array, Schema.optional),
});
export const decodeLLMCodeBlocks = Schema.decodeUnknown(
	LLMCodeBlockSchema.pipe(Schema.Array),
);

export interface LLMContext {
	ast: ReadonlyArray<LLMCodeBlock>;
	references?: Record<string, { shortBody: string; symbol: string }>;
	signature?: string;
}
