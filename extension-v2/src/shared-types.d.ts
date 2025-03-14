import type { CustomNode } from "./graph/graph.types";
import type { Edge } from "@xyflow/react";

export * from "./graph/graph.types";

export type ServerToClientEvents =
	| {
			type: "nodes";
			value: CustomNode[];
	  }
	| {
			type: "edges";
			value: Edge[];
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
			type: "highlight-node-source";
			idRange: [string, string];
	  };
