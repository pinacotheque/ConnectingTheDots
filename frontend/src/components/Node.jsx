import React from 'react';

export const Node = ({ node, onClick, onEdgeCreate }) => {
  return (
    <div 
      className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{node.label}</h3>
          <p className="mt-1 text-sm text-gray-500">{node.description}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdgeCreate(node);
          }}
          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800"
        >
          Create Edge
        </button>
      </div>
      
      {node.edges && node.edges.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700">Edges:</h4>
          <ul className="mt-2 space-y-2">
            {node.edges.map((edge) => (
              <li key={edge.id} className="text-sm text-gray-600">
                {edge.source_node.label} → {edge.target_node.label}
                <span className="text-gray-400"> ({edge.property_wikidata_id})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 