import { Schema } from "effect";
import type { Lang } from "@ast-grep/napi";
import z from "zod";

////////////////////////////////////////////////////////////
// Output Types
////////////////////////////////////////////////////////////

export type CodeReference = {
	id: string;
	symbol: string;
	fullHash: string;
	body: string;
	range: CodeRange;
	filePath: string;
	lang: Lang;
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
	children: CodeBlock[];
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

export class LLMError {
	readonly _tag = "LLMError";
	constructor(readonly message: string) {}
}

// Define the types for the abstraction tree output
export type AbstractionGroup = {
	label: string;
	idRange: readonly [string, string];
	type: string;
	referenceID?: string | null;
	children?: readonly AbstractionGroup[];
};

export type AbstractionTreeOutput = {
	output: readonly AbstractionGroup[];
};

// Create a Zod schema for parsing the output
export const abstractionGroupSchema: z.ZodType<AbstractionGroup> = z.lazy(() =>
	z.object({
		label: z.string(),
		idRange: z.tuple([z.string(), z.string()]),
		type: z.string(),
		referenceID: z.string().optional().nullish(),
		children: z.array(abstractionGroupSchema).optional(),
	}),
);

export const abstractionTreeSchema = z.object({
	output: z.array(abstractionGroupSchema),
});
