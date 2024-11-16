import { type CustomData, nodeTypes } from "./nodes.schema";

export function StackedNodes({ data }: { data: CustomData }) {
	return (
		<div className="bg-white rounded-lg p-2 overflow-hidden">
			{data.children.map((n) => {
				const Component = nodeTypes[n.type];

				return <Component key={n.id} data={n} />;
			})}
		</div>
	);
}
