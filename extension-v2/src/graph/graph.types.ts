import type { Node } from "@xyflow/react";
import type { CodeRange } from "../ast/ast.schema";
export type NodeConnection = {
	sourceId: string;
	targetId: string;
	sourceHandle: string;
	targetHandle: string;
};

export type NodeProps = {
	id: string;
	label: string;
	codeRange: [CodeRange, CodeRange];
	filePath: string;
	children: NodeProps[];
	expanded: boolean;
	type: string;
};

export type CustomNode = Node<NodeProps> & {
	type: "stacked";
};
