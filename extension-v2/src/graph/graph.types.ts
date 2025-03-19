import type { Node } from "@xyflow/react";
import type { CodeRange } from "../ast/ast.schema";
export type NodeConnection = {
	sourceId: string;
	targetId: string;
	sourceHandle: string;
	targetHandle: string;
};

export type NodeProps = {
	// unique id for the node, in the form of "chunkID-a.b.c-x.y.z"
	id: string;

	// the first 7 characters of the hash of the raw AST that this node is part of
	chunkId: string;
	isChunkRoot: boolean;

	// unique id of the node connected to this node
	// defaults to "root" for the very first node
	parentId: string;

	label: string;
	codeRange: [CodeRange, CodeRange];
	filePath: string;

	// the children actually being displayed in the node
	children: NodeProps[];

	// unique id of the root node of the next chunk
	refID?: string;

	expanded: boolean;
	type: string;
};

export type CustomNode = Node<NodeProps> & {
	type: "stacked";
};
