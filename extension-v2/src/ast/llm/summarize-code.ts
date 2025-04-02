import { Effect } from "effect";
import { hashString } from "../../utils/hash";
import { zodResponseFormat } from "openai/helpers/zod";
import z from "zod";
import {
	getModelFromWorkspaceConfig,
	getOpenAIClientFromWorkspaceConfig,
	SHOULD_USE_MOCK,
} from "./llm-config";
import { getNodifyWorkspaceDir } from "../../utils/get-nodify-workspace-dir";
import fs from "node:fs/promises";
import { LLMError } from "./llm.schema";
import { countTokens } from "gpt-tokenizer";

const summarySchema = z.object({
	summary: z.string(),
});

/**
 * LLM-based code summarization
 *
 * @param code The code to summarize
 * @returns An LLM-generated summary
 */
export function summarizeCode(code: string) {
	return Effect.gen(function* () {
		if (SHOULD_USE_MOCK) {
			return yield* summarizeCodeMock(code);
		}

		const model = getModelFromWorkspaceConfig();
		const client = getOpenAIClientFromWorkspaceConfig();

		// For very short code snippets, just use the code itself as the summary
		const dirPath = getNodifyWorkspaceDir();
		const codeHash = yield* hashString(code);
		const path = `${dirPath}/summaries_cache/${codeHash}.json`;
		const logPath = `${dirPath}/llm_logs/${codeHash}-summary.json`;
		const exists = yield* Effect.promise(() =>
			fs
				.access(path)
				.then(() => true)
				.catch(() => false),
		);
		if (exists) {
			const data = yield* Effect.tryPromise(() =>
				fs.readFile(path, { encoding: "utf8" }),
			);
			try {
				return {
					summary: summarySchema.parse(JSON.parse(data)).summary,
				};
			} catch (error) {
				console.error("Failed to parse summary", error);
			}
		}

		const systemPrompt = `Summarize code snippets concisely. Focus on core functionality only.

RULES:
- Keep summaries shorter than the code itself
- Respond in JSON format
- For short functions (< 5 lines), use 5-15 words
- For medium and large code blocks, use 1-2 sentences
- Use technical terms appropriate for developers
- Use as few words as possible to convey the most information, no need full sentences

EXAMPLE:
\`\`\`python
def calculate_average(numbers):
    total = sum(numbers)
    count = len(numbers)
    if count == 0:
        return 0
    return total / count
\`\`\`

EXAMPLE OUTPUT:
{
  "summary": "Arithmetic mean for list of numbers"
}
`;

		console.error("Summarizing code", code.slice(0, 20));
		const tokens = countTokens(code);
		if (tokens > 15_000) {
			return {
				summary: "Code is too long to summarize",
			};
		}
		const res = yield* Effect.tryPromise({
			try: () =>
				client.beta.chat.completions.parse({
					messages: [
						{ role: "system", content: systemPrompt },
						{
							role: "user",
							content: code,
						},
					],
					model: model,
					response_format: zodResponseFormat(summarySchema, "summary"),
					temperature: 0,
				}),
			catch: (error) => {
				console.error("Failed to summarize code", error);
				return new LLMError(
					error instanceof Error ? error.message : "Unknown error",
				);
			},
		});
		console.error(`got llm response ${JSON.stringify(res).slice(0, 100)}...`);

		const parsed = res.choices[0].message.parsed;
		const summary = parsed?.summary ?? code.slice(0, 100);
		yield* Effect.tryPromise(() =>
			fs.writeFile(path, JSON.stringify({ summary }, null, 2)),
		);

		// Save LLM logs including system and user prompts
		yield* Effect.tryPromise(() =>
			fs.mkdir(`${dirPath}/llm_logs`, { recursive: true }),
		);
		yield* Effect.tryPromise(() =>
			fs.writeFile(
				logPath,
				JSON.stringify(
					[
						{ role: "system", content: systemPrompt },
						{ role: "user", content: code },
						{ role: "assistant", content: res },
					],
					null,
					2,
				),
			),
		);

		return {
			summary,
		};
	});
}

export function summarizeCodeMock(code: string) {
	return Effect.succeed({
		summary: code.slice(0, 100),
	});
}
