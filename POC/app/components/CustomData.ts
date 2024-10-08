import type { Node } from "@xyflow/react";

export type CustomData = {
	text: string;
	og_pos: { x: number; y: number };
	onExpand: (node: CustomNode) => void;
	groupId: string | null;
	expanded: boolean;
};

export type CustomNode = Node<CustomData>;
