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
} from "react-bootstrap";
import { getSpace, joinSpace, leaveSpace } from "../api/auth";
import "../styles/spaceDetail.css";

function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
    </Container>
  );
}

export default SpaceDetail;
