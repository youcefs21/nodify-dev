import type { Node } from "@xyflow/react";

export type CustomData = {
	text: string;
	groupId: string;
	og_pos: { x: number; y: number };
	onExpand: (parent: Node<CustomData>) => void;
};

export type CustomNode = Node<CustomData>;
