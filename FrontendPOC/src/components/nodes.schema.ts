import type { Node } from "@xyflow/react";
import { DatastoreNode } from "./DatastoreNode";
import { Schema } from "effect";

export type CustomData = {
	id: string;
	label: string;
	idRange: [number, number];
	children: CustomData[];
	// add more node properties
};

export const NodeTypesSchema = Schema.Literal(
	"expression",
	"function",
	"entry",
	"event",
	"loop",
	"condition",
);

export const nodeTypes = {
	expression: DatastoreNode,
	function: DatastoreNode,
	entry: DatastoreNode,
	event: DatastoreNode,
	loop: DatastoreNode,
	condition: DatastoreNode,
} satisfies Record<NodeTypes, typeof DatastoreNode>;

// don't worry about it
export type CustomNode = Node<CustomData> & { type: NodeTypes };
export type NodeTypes = Schema.Schema.Type<typeof NodeTypesSchema>;
