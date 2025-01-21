import { AbstractNode } from "./AbstractNode";
import type { CustomData } from "./nodes.schema";

import { Webhook } from "lucide-react";

const EventNode = ({ data }: { data: CustomData }) => {
	return (
		<AbstractNode
			data={data}
			Icon={Webhook} // Using ChevronRight as an example icon
			className="bg-purple-500"
		/>
	);
};

export default EventNode;
