import { AbstractNode } from "./AbstractNode";
import type { CustomData } from "./nodes.schema";

import { Variable } from "lucide-react";

const FunctionNode = ({ data }: { data: CustomData }) => {
	console.log("data", data);
	return (
		<AbstractNode
			data={data}
			Icon={Variable} // Using ChevronRight as an example icon
			className="bg-blue-500"
			totalWidth={300}
		/>
	);
};

export default FunctionNode;
