import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Badge,
  Modal,
  Form,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  getSpace,
  joinSpace,
  leaveSpace,
  searchWikidata,
  getWikidataProperties,
  createNode,
  deleteSpace,
  createEdge,
  getEdges,
} from "../api/auth";
import "../styles/spaceDetail.css";

const nodeTypes = {
  default: ({ data }) => (
    <div
      style={{
        padding: "10px",
        borderRadius: "5px",
        backgroundColor: "#fff",
        border: "1px solid #ddd",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        style={{ background: "#555" }}
      />
      <div style={{ fontWeight: "bold" }}>{data.label}</div>
      {data.description && (
        <div style={{ fontSize: "0.8em", color: "#666" }}>
          {data.description}
        </div>
      )}
      <div style={{ fontSize: "0.7em", color: "#999" }}>
        ID: {data.wikidata_id}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        style={{ background: "#555" }}
      />
    </div>
  ),
};

const edgeStyles = {
  stroke: "#FF5733",
  strokeWidth: 2,
};

function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [showCreateNode, setShowCreateNode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState({});
  const [nodeLoading, setNodeLoading] = useState(false);
  const [nodeError, setNodeError] = useState(null);

  const [selectedValues, setSelectedValues] = useState({});
  const [expandedProperties, setExpandedProperties] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [createNodeStep, setCreateNodeStep] = useState("search");
  const [selectedSourceNode, setSelectedSourceNode] = useState(null);
  const [relationSearchQuery, setRelationSearchQuery] = useState("");
  const [relationSearchResults, setRelationSearchResults] = useState([]);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const [relationLoading, setRelationLoading] = useState(false);

  const fetchEdges = async () => {
    try {
      const edgesData = await getEdges(spaceId);

      if (!edgesData || edgesData.length === 0) {
        setEdges([]);
        return;
      }

      const flowEdges = edgesData.map((edge) => ({
        id: edge.id.toString(),
        source: edge.source_node.id.toString(),
        sourceHandle: "source",
        target: edge.target_node.id.toString(),
        targetHandle: "target",
        label: edge.label || edge.property_wikidata_id,
        data: {
          sourceLabel: edge.source_node.label,
          targetLabel: edge.target_node.label,
          propertyId: edge.property_wikidata_id,
        },
        type: "default",
        animated: true,
        style: { stroke: "#FF5733", strokeWidth: 2 },
        markerEnd: {
          type: "arrowclosed",
        },
        labelStyle: { fill: "#000", fontWeight: 700 },
        labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
        labelBgPadding: [4, 4],
        labelBgBorderRadius: 4,
      }));

      setEdges(flowEdges);
    } catch (err) {
      setEdges([]);
    }
  };

  useEffect(() => {
    fetchSpaceData();
    fetchEdges();
  }, [spaceId]);

  useEffect(() => {
    if (space?.nodes) {
      const flowNodes = space.nodes.map((node, index) => ({
        id: node.id.toString(),
        type: "default",
        position: {
          x: 100 + (index % 3) * 250,
          y: 100 + Math.floor(index / 3) * 200,
        },
        data: {
          label: node.label,
          description: node.description,
          wikidata_id: node.wikidata_id,
        },
        connectable: true,
      }));

      setNodes(flowNodes);

      if (flowNodes.length > 0) {
        fetchEdges();
      }
    }
  }, [space?.nodes, setNodes]);

  const fetchSpaceData = async () => {
    try {
      setLoading(true);
      const response = await getSpace(spaceId);
      setSpace(response);
    } catch (err) {
      setError("Failed to load space data");
      console.error("Error fetching space:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSpace = async () => {
    try {
      setActionLoading(true);
      const response = await joinSpace(spaceId);
      setSpace(response.space);
    } catch (err) {
      setError("Failed to join space");
      console.error("Error joining space:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveSpace = async () => {
    try {
      setActionLoading(true);
      const response = await leaveSpace(spaceId);
      setSpace(response.space);
    } catch (err) {
      setError("Failed to leave space");
      console.error("Error leaving space:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;

    setNodeLoading(true);
    setNodeError(null);
    try {
      const results = await searchWikidata(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setNodeError("Failed to search Wikidata");
      console.error("Error searching Wikidata:", err);
    } finally {
      setNodeLoading(false);
    }
  };

  const handleEntitySelect = async (entity) => {
    setSelectedEntity(entity);
    setNodeLoading(true);
    setNodeError(null);
    try {
      const properties = await getWikidataProperties(entity.wikidata_id);
      setProperties(properties);
      if (space.nodes && space.nodes.length > 0) {
        setCreateNodeStep("selectSource");
      } else {
        setCreateNodeStep("selectRelation");
      }
    } catch (err) {
      setNodeError("Failed to fetch entity properties");
      console.error("Error fetching properties:", err);
    } finally {
      setNodeLoading(false);
    }
  };

  const handleSourceNodeSelect = (node) => {
    setSelectedSourceNode(node);
    setCreateNodeStep("selectRelation");
  };

  const handleRelationSearch = async () => {
    if (relationSearchQuery.length < 2) return;

    setRelationLoading(true);
    try {
      const results = await searchWikidata(relationSearchQuery);
      setRelationSearchResults(results);
    } catch (err) {
      setNodeError("Failed to search relationship type");
      console.error("Error searching relationship:", err);
    } finally {
      setRelationLoading(false);
    }
  };

  const handleRelationSelect = (relation) => {
    setSelectedRelation(relation);
  };

  const handlePropertyToggle = (property) => {
    setExpandedProperties((prev) => ({
      ...prev,
      [property.wikidata_id]: !prev[property.wikidata_id],
    }));
  };

  const handleValueToggle = (propertyId, valueId) => {
    setSelectedValues((prev) => {
      const currentValues = prev[propertyId] || [];
      const newValues = currentValues.includes(valueId)
        ? currentValues.filter((id) => id !== valueId)
        : [...currentValues, valueId];

      return {
        ...prev,
        [propertyId]: newValues,
      };
    });
  };

  const handleNodeSubmit = async () => {
    if (!selectedEntity) return;

    setNodeLoading(true);
    setNodeError(null);
    try {
      const nodeData = await createNode(
        spaceId,
        selectedEntity,
        selectedValues,
        properties
      );

      if (selectedSourceNode && selectedRelation) {
        try {
          const sourceNodeId = parseInt(selectedSourceNode.id, 10);
          const targetNodeId = parseInt(nodeData.id, 10);

          if (isNaN(sourceNodeId) || isNaN(targetNodeId)) {
            throw new Error("Invalid node IDs");
          }

          await createEdge(
            sourceNodeId,
            targetNodeId,
            selectedRelation.wikidata_id
          );

          await fetchSpaceData();
          await fetchEdges();
        } catch (edgeErr) {
          console.error("Error creating edge:", edgeErr);
          setNodeError("Node created but failed to create relationship");
          await fetchSpaceData();
        }
      } else {
        setSpace((prev) => ({
          ...prev,
          nodes: [...prev.nodes, nodeData],
        }));

        await fetchSpaceData();
        await fetchEdges();
      }

      handleCloseCreateNode();
    } catch (err) {
      setNodeError("Failed to create node");
      console.error("Error creating node:", err);
    } finally {
      setNodeLoading(false);
    }
  };

  const handleCloseCreateNode = () => {
    setShowCreateNode(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedEntity(null);
    setProperties([]);
    setSelectedProperties({});
    setSelectedValues({});
    setExpandedProperties({});
    setNodeError(null);
    setCreateNodeStep("search");
    setSelectedSourceNode(null);
    setRelationSearchQuery("");
    setRelationSearchResults([]);
    setSelectedRelation(null);
  };

  const handleDeleteSpace = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await deleteSpace(spaceId);
      navigate("/");
    } catch (err) {
      setDeleteError(err.message || "Failed to delete space");
      console.error("Error deleting space:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="space-detail-container">
        <div>Loading space information...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="space-detail-container">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!space) {
    return (
      <Container className="space-detail-container">
        <Alert variant="warning">Space not found</Alert>
      </Container>
    );
  }

  return (
    <Container className="space-detail-container">
      <Row className="mb-4">
        <Col>
          <h2>{space.title}</h2>
          <p className="text-muted">Created by {space.owner.username}</p>
        </Col>
        <Col xs="auto">
          {space.is_owner ? (
            <>
              <Button
                variant="primary"
                onClick={() => navigate(`/spaces/${spaceId}/edit`)}
                className="me-2"
              >
                Edit Space
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                Delete Space
              </Button>
            </>
          ) : space.is_contributor ? (
            <Button
              variant="danger"
              onClick={handleLeaveSpace}
              disabled={actionLoading}
            >
              {actionLoading ? "Leaving..." : "Leave Space"}
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleJoinSpace}
              disabled={actionLoading}
            >
              {actionLoading ? "Joining..." : "Join Space"}
            </Button>
          )}
        </Col>
      </Row>

      {(space.is_owner || space.is_contributor) && (
        <Row className="mb-4">
          <Col>
            <Button variant="primary" onClick={() => setShowCreateNode(true)}>
              Add Node
            </Button>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Description</Card.Title>
              <Card.Text>{space.description}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Tags</Card.Title>
              <div className="tags-container">
                {space.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    bg="secondary"
                    className="me-2 mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      window.open(
                        `https://www.wikidata.org/wiki/${tag.wikidata_id}`,
                        "_blank"
                      )
                    }
                  >
                    {tag.name}
                    <small className="ms-1 text-light">
                      ({tag.wikidata_id})
                    </small>
                  </Badge>
                ))}
                {space.tags.length === 0 && (
                  <p className="text-muted">No tags added yet</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Collaborators</Card.Title>
              <div className="collaborators-list">
                {space.contributors.map((contributor) => (
                  <div key={contributor.id} className="collaborator-item">
                    <span className="collaborator-name">
                      {contributor.username}
                    </span>
                  </div>
                ))}
                {space.contributors.length === 0 && (
                  <p className="text-muted">No collaborators yet</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Graph View</Card.Title>
              <div style={{ width: "100%", height: "600px" }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  fitView
                  connectionLineStyle={edgeStyles}
                  defaultEdgeOptions={{
                    type: "default",
                    animated: true,
                    style: edgeStyles,
                    sourceHandle: "source",
                    targetHandle: "target",
                    markerEnd: {
                      type: "arrowclosed",
                    },
                    labelStyle: { fill: "#000", fontWeight: 700 },
                    labelBgStyle: { fill: "#fff", fillOpacity: 0.8 },
                    labelBgPadding: [4, 4],
                    labelBgBorderRadius: 4,
                  }}
                >
                  <Controls />
                  <MiniMap />
                  <Background variant="dots" gap={12} size={1} />
                  <Panel position="top-right">
                    <Button size="sm" onClick={fetchEdges}>
                      Refresh Edges
                    </Button>
                  </Panel>
                </ReactFlow>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Nodes</Card.Title>
              {space.nodes && space.nodes.length > 0 ? (
                <div className="nodes-list">
                  {space.nodes.map((node) => (
                    <Card key={node.id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 className="mb-1">{node.label}</h5>
                            <p className="text-muted mb-2">
                              {node.description}
                            </p>
                            <div className="text-muted small">
                              Wikidata ID: {node.wikidata_id}
                            </div>
                          </div>
                          <div className="text-muted small">
                            Created by {node.creator.username}
                          </div>
                        </div>

                        {Object.entries(node.properties).length > 0 && (
                          <div className="mt-3">
                            <h6 className="mb-2">Properties:</h6>
                            {Object.entries(node.properties).map(
                              ([propId, propData]) => (
                                <div key={propId} className="mb-2">
                                  <div className="fw-bold">
                                    {propData.label}
                                  </div>
                                  {propData.values.length > 0 ? (
                                    <div className="ms-3">
                                      {propData.values.map((value, index) => (
                                        <Badge
                                          key={index}
                                          bg="info"
                                          className="me-2"
                                        >
                                          {value}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="ms-3 text-muted">
                                      No values
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No nodes created yet</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Node Modal */}
      <Modal show={showCreateNode} onHide={handleCloseCreateNode} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Node</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {nodeError && <div className="alert alert-danger">{nodeError}</div>}

          <div className="mb-4">
            <h5>1. Search and Select Entity</h5>
            <Form.Group className="mb-3">
              <Form.Label>Search Wikidata</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter search term..."
                />
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  disabled={nodeLoading || searchQuery.length < 2}
                  className="ms-2"
                >
                  {nodeLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </Form.Group>

            {searchResults.length > 0 && (
              <ListGroup>
                {searchResults.map((result) => (
                  <ListGroup.Item
                    key={result.wikidata_id}
                    action
                    onClick={() => handleEntitySelect(result)}
                  >
                    <h6>{result.label}</h6>
                    {result.description && (
                      <small className="text-muted">{result.description}</small>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>

          {selectedEntity && (
            <>
              <div className="mb-4">
                <h5>2. Select Source Node (Optional)</h5>
                <Form.Group>
                  <Form.Select
                    value={selectedSourceNode?.id || ""}
                    onChange={(e) => {
                      const nodeId = e.target.value;
                      if (!nodeId) {
                        setSelectedSourceNode(null);
                        return;
                      }
                      const node = space.nodes.find(
                        (n) => n.id === parseInt(nodeId, 10)
                      );
                      setSelectedSourceNode(node || null);
                    }}
                  >
                    <option value="">Select a source node...</option>
                    {space.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              {selectedSourceNode && (
                <div className="mb-4">
                  <h5>3. Select Relationship Type</h5>
                  <Form.Group className="mb-3">
                    <Form.Label>Search and Select Relationship Type</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        value={relationSearchQuery}
                        onChange={(e) => {
                          setRelationSearchQuery(e.target.value);
                          if (e.target.value.length >= 2) {
                            handleRelationSearch();
                          } else {
                            setRelationSearchResults([]);
                          }
                        }}
                        placeholder="Search relationship type..."
                        className="mb-2"
                      />
                      {relationLoading && (
                        <div className="position-absolute top-0 end-0 mt-2 me-2">
                          <Spinner animation="border" size="sm" />
                        </div>
                      )}
                      {relationSearchResults.length > 0 && (
                        <div
                          className="position-absolute w-100 bg-white border rounded shadow-sm"
                          style={{
                            zIndex: 1000,
                            maxHeight: "200px",
                            overflowY: "auto",
                          }}
                        >
                          {relationSearchResults.map((result) => (
                            <div
                              key={result.wikidata_id}
                              className={`p-2 cursor-pointer ${
                                selectedRelation?.wikidata_id ===
                                result.wikidata_id
                                  ? "bg-light"
                                  : ""
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                handleRelationSelect(result);
                                setRelationSearchQuery(result.label);
                                setRelationSearchResults([]);
                              }}
                            >
                              <div className="fw-bold">{result.label}</div>
                              {result.description && (
                                <small className="text-muted">
                                  {result.description}
                                </small>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedRelation && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <div className="fw-bold">
                          Selected: {selectedRelation.label}
                        </div>
                        {selectedRelation.description && (
                          <small className="text-muted">
                            {selectedRelation.description}
                          </small>
                        )}
                      </div>
                    )}
                  </Form.Group>
                </div>
              )}

              <div className="mb-4">
                <h5>4. Select Properties</h5>
                <div className="properties-container">
                  {properties
                    .sort((a, b) => b.values.length - a.values.length)
                    .map((property) => (
                      <div key={property.wikidata_id} className="mb-3">
                        <div
                          className="d-flex align-items-center property-header"
                          style={{ cursor: "pointer" }}
                          onClick={() => handlePropertyToggle(property)}
                        >
                          <i
                            className={`bi bi-chevron-${
                              expandedProperties[property.wikidata_id]
                                ? "down"
                                : "right"
                            } me-2`}
                          />
                          <span>
                            {property.label} ({property.wikidata_id}) -{" "}
                            {property.values.length} values
                          </span>
                        </div>
                        {expandedProperties[property.wikidata_id] && (
                          <div className="ms-4 mt-2">
                            <small className="text-muted">Values:</small>
                            <ul className="list-unstyled ms-3">
                              {property.values
                                .filter(
                                  (v) => v && typeof v === "object" && v.id
                                )
                                .map((value, index) => (
                                  <li key={index} className="text-muted">
                                    <Form.Check
                                      type="checkbox"
                                      id={`${property.wikidata_id}-${value.id}`}
                                      label={value.id}
                                      checked={selectedValues[
                                        property.wikidata_id
                                      ]?.includes(value.id)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleValueToggle(
                                          property.wikidata_id,
                                          value.id
                                        );
                                      }}
                                      className="ms-2"
                                    />
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCreateNode}>
            Cancel
          </Button>
          {selectedEntity && (
            <Button
              variant="primary"
              onClick={handleNodeSubmit}
              disabled={
                nodeLoading ||
                Object.keys(selectedValues).length === 0 ||
                (selectedSourceNode && !selectedRelation)
              }
            >
              {nodeLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Create Node"
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Space</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && <Alert variant="danger">{deleteError}</Alert>}
          <p>
            Are you sure you want to delete this space? This action cannot be
            undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteSpace}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              "Delete Space"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default SpaceDetail;
