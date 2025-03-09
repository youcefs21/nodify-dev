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
