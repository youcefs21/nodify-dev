import type { CodeRange } from "./ast/ast.schema";
import type { CustomNode } from "./graph/graph.types";
import type { Edge } from "@xyflow/react";

export * from "./graph/graph.types";

export type ServerToClientEvents =
	| {
			type: "all-nodes";
			value: CustomNode[];
	  }
	| {
			type: "nodes";
			value: CustomNode[];
	  }
	| {
			type: "edges";
			value: Edge[];
	  }
	| {
			type: "base-url";
			value: string;
	  };

export type ClientToServerEvents =
	| {
			type: "on-render";
	  }
	| {
			type: "node-toggle";
			nodeId: string;
	  }
	| {
			type: "highlight-node";
			nodeId: string;
			filePath: string;
			codeRange: [CodeRange, CodeRange];
	  };
