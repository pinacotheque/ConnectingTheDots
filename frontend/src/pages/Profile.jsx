import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Tab, Nav, Alert, Badge, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getUserProfile } from "../api/auth";
import "../styles/profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [ownedSpaces, setOwnedSpaces] = useState([]);
  const [contributedSpaces, setContributedSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setUser(data.user);
      setOwnedSpaces(data.owned_spaces);
      setContributedSpaces(data.contributed_spaces);
    } catch (err) {
      setError("Failed to load profile data");
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="profile-container">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="profile-container">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="profile-container">
      <Row className="mb-4">
        <Col>
          <h2>Profile</h2>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="profile-card">
            <Card.Body>
              <Card.Title>User Information</Card.Title>
              <div className="profile-info">
                <p>
                  <strong>Username:</strong> {user?.username}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <div className="mt-3">
                  <Badge bg="primary" className="me-2">
                    {ownedSpaces.length} Owned Spaces
                  </Badge>
                  <Badge bg="info">
                    {contributedSpaces.length} Contributed Spaces
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Tab.Container defaultActiveKey="owned">
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="owned">Owned Spaces</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="contributed">Contributed Spaces</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="owned">
                <div className="spaces-grid">
                  {ownedSpaces.length > 0 ? (
                    ownedSpaces.map((space) => (
                      <Card key={space.id} className="space-card">
                        <Card.Body>
                          <Card.Title>
                            <Link to={`/spaces/${space.id}`}>{space.title}</Link>
                          </Card.Title>
                          <Card.Text>{space.description}</Card.Text>
                          {space.tags && space.tags.length > 0 && (
                            <div className="space-tags">
                              {space.tags.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  bg="secondary"
                                  className="me-1 mb-1"
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="text-muted small mt-2">
                            Created: {new Date(space.created_at).toLocaleDateString()}
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-muted p-4">
                      <p>You haven't created any spaces yet.</p>
                      <Link to="/spaces/create" className="btn btn-sm btn-primary">
                        Create a Space
                      </Link>
                    </div>
                  )}
                </div>
              </Tab.Pane>
              <Tab.Pane eventKey="contributed">
                <div className="spaces-grid">
                  {contributedSpaces.length > 0 ? (
                    contributedSpaces.map((space) => (
                      <Card key={space.id} className="space-card">
                        <Card.Body>
                          <Card.Title>
                            <Link to={`/spaces/${space.id}`}>{space.title}</Link>
                          </Card.Title>
                          <Card.Text>{space.description}</Card.Text>
                          {space.tags && space.tags.length > 0 && (
                            <div className="space-tags">
                              {space.tags.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  bg="secondary"
                                  className="me-1 mb-1"
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="text-muted small mt-2">
                            Owner: {space.owner?.username}
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-muted p-4">
                      <p>You haven't joined any spaces yet.</p>
                      <Link to="/" className="btn btn-sm btn-primary">
                        Explore Spaces
                      </Link>
                    </div>
                  )}
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;
