import { AbstractNode } from "./AbstractNode";
import type { CustomData } from "./nodes.schema";

import { Variable } from "lucide-react";

const ExpressionNode = ({ data }: { data: CustomData }) => {
	return (
		<AbstractNode
			data={data}
			Icon={Variable} // Using ChevronRight as an example icon
			className="bg-zinc-500"
			totalWidth={300}
		/>
	);
};

export default ExpressionNode;
