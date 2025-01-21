import type { LLMOutput } from "./src/llm.types";
export * from "./src/llm.types";

export type ServerToClientEvents = {
	type: "flows";
	value: LLMOutput[];
};
// {
// 	noArg: () => void;
// 	basicEmit: (a: number, b: string, c: Buffer) => void;
// 	withAck: (d: string, callback: (e: number) => void) => void;
// }

export type ClientToServerEvents = {
	type: "hello";
	value: string;
};
