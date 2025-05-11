import React from 'react';
import { Node } from './Node';

export const NodeList = ({ nodes, onNodeClick, onEdgeCreate }) => {
  return (
    <div className="space-y-4">
      {nodes.map((node) => (
        <Node
          key={node.id}
          node={node}
          onClick={() => onNodeClick(node)}
          onEdgeCreate={onEdgeCreate}
        />
      ))}
    </div>
  );
}; 