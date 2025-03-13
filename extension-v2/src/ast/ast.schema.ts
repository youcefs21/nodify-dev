////////////////////////////////////////////////////////////
// Ast Grep Kinds

import { Schema } from "effect";

////////////////////////////////////////////////////////////
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

export const ignoreKinds = [
	"=",
	"identifier",
	"integer",
	"[",
	"]",
	"(",
	")",
	",",
	"lambda",
	":",
	"lambda_parameters",
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

export type CodeRange = {
	start: {
		line: number;
		character: number;
	};
	end: {
		line: number;
		character: number;
	};
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
	references: Record<string, { summary: string; symbol: string }>;
}
