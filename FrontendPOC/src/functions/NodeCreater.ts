import type { CustomNode, NodeTypes, output } from "../components/nodes.schema";

export function AbstractionLevelOneNodeMapper(output: output[]): CustomNode[] {
	// Map the output nodes recursively, starting with depth 1
	return output.map((node) => mapSingleNode(node, 1));
}

// Helper function to map a single node to CustomNode
function mapSingleNode(node: output, depth: number): CustomNode {
	const nodeType: NodeTypes = mapNodeType(node.type);

	return {
		id: `${node.groupID}`,
		data: {
			id: `${node.groupID}`,
			label: node.label,
			idRange: node.idRange,
			type: nodeType,
			children: node.children
				? node.children.map((child) => {
						const childNode = mapSingleNode(child, depth + 1);
						return {
							...childNode.data,
							position: childNode.position,
						};
					})
				: [],
			reversed: false,
			active: true,
			disabled: false,
		},
		type: "stacked",
		position: { x: 300 * depth, y: 0 },
	};
}

// Helper function to map node type to NodeTypes enum
function mapNodeType(type: string): NodeTypes {
	switch (type) {
		case "function_call":
			return "function";
		case "expression":
			return "expression";
		case "event_handler_setup":
			return "event";
		case "loop":
			return "loop";
		case "conditional":
			return "condition";
		case "entry":
			return "entry";
		default:
			throw new Error(
				`Unknown node type: ${type}. Please check the input data.`,
			);
	}
}

export function flattenCustomNodes(nodes: CustomNode[]): CustomNode[] {
	const flattened: CustomNode[] = [];

	function flattenNode(node: CustomNode, depth: number, verticalDepth: number) {
		node.id = node.data.id; // Ensure the node ID is set to its groupID
		node.position = { x: 300 * depth, y: 100 * verticalDepth }; // Adjust position based on depth and verticalDepth to avoid overlap
		if (node.data.children.length > 0) {
			flattened.push(node);
		}
		for (let i = 0; i < node.data.children.length; i++) {
			const childData = node.data.children[i];
			const childNode: CustomNode = {
				...node,
				id: childData.id, // Set the child node ID to its groupID
				data: childData,
			};
			flattenNode(childNode, depth + 1, verticalDepth + i); // Keep verticalDepth the same for the first child and increment for subsequent children
		}
	}

	for (let i = 0; i < nodes.length; i++) {
		flattenNode(nodes[i], 1, i); // Start verticalDepth from the same level as the root
	}

	return flattened;
}

export function createEdges(nodes: CustomNode[]): {
	id: string;
	source: string;
	target: string;
	sourceHandle: string;
	targetHandle: string;
}[] {
	const edges: {
		id: string;
		source: string;
		target: string;
		sourceHandle: string;
		targetHandle: string;
	}[] = [];

	function addEdgesForNode(node: CustomNode) {
		if (node.data.children && node.data.children.length > 0) {
			for (const child of node.data.children) {
				edges.push({
					id: `e${node.data.id}-${child.id}`,
					source: node.data.id,
					target: child.id,
					sourceHandle: `${node.data.id}-source`,
					targetHandle: `${child.id}-target`,
				});
				// Recursively create edges for each child node
				addEdgesForNode({ ...node, data: child, id: child.id });
			}
		}
	}

	for (const node of nodes) {
		addEdgesForNode(node);
	}

	return edges;
}
export const entryNode: output = {
	groupID: -2,
	label: "Dummy",
	idRange: [0, 999],
	type: "entry",
	children: [
		{
			groupID: -1,
			label: "Entry",
			idRange: [0, 999],
			type: "entry",
			children: [],
		},
	],
};
