import type { Edge } from "@xyflow/react";
import type { CustomNode } from "./graph.types";
import type * as vscode from "vscode";
import type { AstLocation } from "../vsc-commands/analyze-document";
export * from "./llm.types";
export * from "./graph.types";

export type ServerToClientEvents =
	| {
			type: "nodes";
			value: CustomNode[];
	  }
	| {
			type: "edges";
			value: Edge[];
	  }
	| {
			type: "cursor-position";
			value: vscode.Position;
	  }
	| {
			type: "ast_locations";
			value: AstLocation[];
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
	  }
	| {
			type: "highlight-node-source";
			idRange: [number, number];
	  };
