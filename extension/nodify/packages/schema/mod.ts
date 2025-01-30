import type { Edge } from "@xyflow/react";
import type { CustomNode } from "./src/graph.types";
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

export type ClientToServerEvents =
	| {
			type: "on-render";
	  }
	| {
			type: "node-toggle";
			nodeId: string;
	  };
