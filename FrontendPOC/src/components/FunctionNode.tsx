import { AbstractNode } from './AbstractNode';
import type { CustomData } from './nodes.schema';

import { Variable  } from 'lucide-react';


const FunctionNode = () => {
  // Example data for CustomData type
  const customNodeData: CustomData = {
    id: 'node-1',
    label: 'Custom Node 1',
    idRange: [1, 100],
    children: [],
    reversed: false,
    active: true,
    disabled: false,
  };

  return (
    <AbstractNode
      data={customNodeData}
      Icon={Variable} // Using ChevronRight as an example icon
      className="bg-blue-500"
      totalWidth={300}
    >
    </AbstractNode>
  );
};

export default FunctionNode;
