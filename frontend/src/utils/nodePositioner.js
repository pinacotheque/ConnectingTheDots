/**
 * @param {Array} nodes 
 * @param {Array} edges 
 * @param {Object} options 
 * @returns {Array}
 */
export const calculateNodePositions = (nodes, edges, options = {}) => {
    if (!nodes.length) return [];

    const centerX = options.centerX || 500;
    const centerY = options.centerY || 300;
    const levelSpacing = options.levelSpacing || 150;

    const nodePositions = {};
    const levelMap = {};
    const processedNodes = new Set();

    const outgoingEdges = {};
    const incomingEdges = {};

    if (nodes.length > 0 && edges && edges.length > 0) {
        edges.forEach((edge) => {
            const sourceId = edge.source;
            const targetId = edge.target;

            if (!outgoingEdges[sourceId]) outgoingEdges[sourceId] = [];
            outgoingEdges[sourceId].push(targetId);

            if (!incomingEdges[targetId]) incomingEdges[targetId] = [];
            incomingEdges[targetId].push(sourceId);
        });

        const rootNodeIds = nodes
            .map((node) => node.id.toString())
            .filter((id) => !incomingEdges[id] || incomingEdges[id].length === 0);

        if (rootNodeIds.length > 0) {
            let currentLevel = 0;
            let currentLevelNodes = rootNodeIds;

            while (currentLevelNodes.length > 0) {
                levelMap[currentLevel] = [...currentLevelNodes];

                currentLevelNodes.forEach((id) => processedNodes.add(id));
                const nextLevelNodes = [];
                currentLevelNodes.forEach((nodeId) => {
                    if (outgoingEdges[nodeId]) {
                        outgoingEdges[nodeId].forEach((childId) => {
                            if (!processedNodes.has(childId)) {
                                nextLevelNodes.push(childId);
                            }
                        });
                    }
                });

                const uniqueNextLevel = [...new Set(nextLevelNodes)];
                currentLevelNodes = uniqueNextLevel;
                currentLevel++;
            }

            const remainingNodes = nodes
                .map((node) => node.id.toString())
                .filter((id) => !processedNodes.has(id));

            if (remainingNodes.length > 0) {
                levelMap[currentLevel] = remainingNodes;
            }
        } else {
            levelMap[0] = nodes.map((node) => node.id.toString());
        }
    } else {
        levelMap[0] = nodes.map((node) => node.id.toString());
    }
    Object.keys(levelMap).forEach((level, levelIndex) => {
        const nodesInLevel = levelMap[level];
        const levelY = centerY + levelIndex * levelSpacing;

        nodesInLevel.forEach((nodeId, nodeIndex) => {
            const levelWidth = Math.max(800, nodesInLevel.length * 200);
            const startX = centerX - levelWidth / 2;
            const spacing = levelWidth / (nodesInLevel.length + 1);
            const nodeX = startX + (nodeIndex + 1) * spacing;

            nodePositions[nodeId] = { x: nodeX, y: levelY };
        });
    });

    return nodes.map((node) => {
        const id = node.id.toString();
        const position = nodePositions[id] || {
            x: centerX + (Math.random() * 200 - 100),
            y: centerY + (Math.random() * 200 - 100),
        };
        return {
            id: id,
            type: "default",
            position: position,
            data: {
                ...node.data,
                id: id,
            },
            connectable: true,
        };
    });
};
