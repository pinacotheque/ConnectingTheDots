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
import {
  getSpace,
  joinSpace,
  leaveSpace,
  searchWikidata,
  getWikidataProperties,
  createNode,
} from "../api/auth";
import axios from "axios";
import "../styles/spaceDetail.css";

function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showCreateNode, setShowCreateNode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState({});
  const [nodeLoading, setNodeLoading] = useState(false);
  const [nodeError, setNodeError] = useState(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);

  const [selectedValues, setSelectedValues] = useState({});
  const [expandedProperties, setExpandedProperties] = useState({});

  useEffect(() => {
    fetchSpaceData();
  }, [spaceId]);

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
    } catch (err) {
      setNodeError("Failed to fetch entity properties");
      console.error("Error fetching properties:", err);
    } finally {
      setNodeLoading(false);
    }
  };

  const handlePropertyToggle = (property) => {
    // Only toggle expanded state
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
      setSpace((prev) => ({
        ...prev,
        nodes: [...prev.nodes, nodeData],
      }));
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
  };

  const handleCreateEdge = async (sourceNodeId, targetNodeId, propertyId) => {
    try {
      const response = await axios.post(
        `/api/nodes/${sourceNodeId}/create_edge/`,
        {
          target_node_id: targetNodeId,
          property_wikidata_id: propertyId,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error creating edge:", error);
      throw error;
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
            <Button
              variant="primary"
              onClick={() => navigate(`/spaces/${spaceId}/edit`)}
            >
              Edit Space
            </Button>
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
                  <Badge key={tag.id} bg="secondary" className="me-2 mb-2">
                    {tag.name}
                  </Badge>
                ))}
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

          {!selectedEntity ? (
            <>
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
                        <small className="text-muted">
                          {result.description}
                        </small>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </>
          ) : (
            <>
              <div className="mb-3">
                <h5>Selected Entity: {selectedEntity.label}</h5>
                {selectedEntity.description && (
                  <p className="text-muted">{selectedEntity.description}</p>
                )}
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Select Properties</Form.Label>
                {properties
                  .sort((a, b) => b.values.length - a.values.length)
                  .map((property) => (
                    <div key={property.wikidata_id} className="mb-3">
                      <div
                        className="d-flex align-items-center"
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
                      {expandedProperties[property.wikidata_id] &&
                        property.values.some(
                          (v) => v && typeof v === "object" && v.id
                        ) && (
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
              </Form.Group>
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
              disabled={nodeLoading || Object.keys(selectedValues).length === 0}
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
    </Container>
  );
}

export default SpaceDetail;
