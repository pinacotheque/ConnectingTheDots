import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Tab, Nav, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
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
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      };
      setUser(mockUser);

      const mockOwnedSpaces = [
        { id: 1, title: "My Space 1", description: "Description 1" },
        { id: 2, title: "My Space 2", description: "Description 2" },
      ];
      const mockContributedSpaces = [
        { id: 3, title: "Contributed Space 1", description: "Description 3" },
        { id: 4, title: "Contributed Space 2", description: "Description 4" },
      ];

      setOwnedSpaces(mockOwnedSpaces);
      setContributedSpaces(mockContributedSpaces);
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
        <div>Loading profile...</div>
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
                  {ownedSpaces.map((space) => (
                    <Card key={space.id} className="space-card">
                      <Card.Body>
                        <Card.Title>
                          <Link to={`/spaces/${space.id}`}>{space.title}</Link>
                        </Card.Title>
                        <Card.Text>{space.description}</Card.Text>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Tab.Pane>
              <Tab.Pane eventKey="contributed">
                <div className="spaces-grid">
                  {contributedSpaces.map((space) => (
                    <Card key={space.id} className="space-card">
                      <Card.Body>
                        <Card.Title>
                          <Link to={`/spaces/${space.id}`}>{space.title}</Link>
                        </Card.Title>
                        <Card.Text>{space.description}</Card.Text>
                      </Card.Body>
                    </Card>
                  ))}
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
