import { AbstractNode } from "./AbstractNode";
import type { CustomData } from "./nodes.schema";

import { SquareFunction } from "lucide-react";

const FunctionNode = ({ data }: { data: CustomData }) => {
	return (
		<AbstractNode
			data={data}
			Icon={SquareFunction} // Using ChevronRight as an example icon
			className="bg-blue-500"
			totalWidth={300}
		/>
	);
};

export default FunctionNode;
