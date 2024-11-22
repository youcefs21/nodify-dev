import { type CustomData, nodeTypes } from "./nodes.schema";

export function StackedNodes({ data }: { data: CustomData }) {
	return (
		<div className="bg-transparent rounded-lg p-3">
			{(() => {
				if (data.id === "-2") return null;

				const nodeData = {
					label: data.label,
					id: `${data.children[0].id}-root`,
					hasChildren: false,
					idRange: data.idRange,
					children: [],
					reversed: false,
					active: false,
					disabled: false,
					type: data.type,
				} satisfies CustomData;

				const Component = nodeTypes[nodeData.type];
				return (
					<div key={nodeData.id} className="border-t border-black box-border">
						<Component data={nodeData} />
					</div>
				);
			})()}
			{data.children.map((n) => {
				const Component = nodeTypes[n.type];

				return (
					<div key={n.id} className="pl-4">
						<Component data={n} />
					</div>
				);
			})}
		</div>
	);
}
