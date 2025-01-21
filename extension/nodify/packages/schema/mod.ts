import type { Edge } from "@xyflow/react";
import type { CustomNode } from "./src/graph.types";
import type { LLMOutput } from "./src/llm.types";
export * from "./src/llm.types";
export * from "./src/graph.types";

export type ServerToClientEvents =
	| {
			type: "nodes";
			value: CustomNode[];
	  }
	| {
			type: "edges";
			value: Edge[];
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
