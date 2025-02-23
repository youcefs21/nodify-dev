import type dynamicIconImports from "lucide-react/dynamicIconImports";
type IconProps = { name: keyof typeof dynamicIconImports };
import type { Node } from "@xyflow/react";

export type NodeConnection = {
	sourceId: string;
	targetId: string;
	sourceHandle: string;
	targetHandle: string;
};

export type NodeProps = {
	id: string;
	hasChildren: boolean;
	label: string;
	idRange: [number, number];
	children: CustomData[];
	reversed: boolean;
	active: boolean;
	disabled: boolean;
	expanded: boolean;
	icon: IconProps["name"];
	iconBackgroundColor: string;
};

export type CustomData = NodeProps & {
	id: string;
};

export type CustomNode = Node<CustomData> & {
	type: "stacked";
};
