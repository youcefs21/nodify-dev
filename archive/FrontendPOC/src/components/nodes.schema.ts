import type { Node } from "@xyflow/react";
import type { DatastoreNode } from "./DatastoreNode";
import { Schema } from "effect";
import FunctionNode from "./FunctionNode";
import ExpressionNode from "./ExpressionNode";
import EntryNode from "./EntryNode";
import LoopNode from "./LoopNode";
import EventNode from "./EventNode";
import ConditionNode from "./ConditionNode";

export type CustomData = {
	id: string;
	hasChildren: boolean;
	label: string;
	idRange: [number, number];
	children: CustomData[];
	reversed: boolean;
	active: boolean;
	disabled: boolean;
	type: NodeTypes;
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
	expression: ExpressionNode,
	function: FunctionNode,
	entry: EntryNode,
	event: EventNode,
	loop: LoopNode,
	condition: ConditionNode,
} satisfies Record<NodeTypes, typeof DatastoreNode>;

export type output = {
	groupID: number;
	label: string;
	idRange: [number, number];
	expanded: boolean;
	type:
		| "function_call"
		| "expression"
		| "event_handler_setup"
		| "loop"
		| "conditional"
		| "entry";
	children?: output[];
};

// don't worry about it
export type NodeTypes = Schema.Schema.Type<typeof NodeTypesSchema>;
export type CustomNode = Node<CustomData> & { type: "stacked" };
