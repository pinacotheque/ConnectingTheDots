import { useState, useEffect } from "react";
import {
  Container,
  Button,
  Form,
  InputGroup,
  Card,
  Badge,
  Col,
  Alert,
} from "react-bootstrap";
import "../styles/home.css";
import searchIcon from "../assets/search.svg";
import { getSpaces, joinSpace, leaveSpace } from "../api/auth";
import { Link } from "react-router-dom";

export default function Home() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningSpace, setJoiningSpace] = useState(null);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const data = await getSpaces();
      setSpaces(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch spaces. Please try again later.");
      console.error("Error fetching spaces:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleJoinSpace = async (spaceId) => {
    try {
      setJoiningSpace(spaceId);
      await joinSpace(spaceId);
      await fetchSpaces();
    } catch (err) {
      setError(err.message || "Failed to join space");
    } finally {
      setJoiningSpace(null);
    }
  };
  const handleLeaveSpace = async (spaceId) => {
    try {
      setJoiningSpace(spaceId);
      await leaveSpace(spaceId);
      await fetchSpaces();
    } catch (err) {
      setError(err.message || "Failed to leave space");
    } finally {
      setJoiningSpace(null);
    }
  };

  const filteredSpaces = spaces.filter(
    (space) =>
      space.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.tags.some((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <Container className="home">
      <div className="col1">Tags</div>
      <div className="col2">
        <div className="search">
          <h4>Search Spaces</h4>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Search spaces..."
              aria-label="space"
              aria-describedby="basic-addon2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline-secondary" id="button-addon2">
              <img
                src={searchIcon}
                width="20"
                height="20"
                className="d-inline-block align-top"
                alt="Search"
              />
            </Button>
          </InputGroup>
        </div>
        <div className="browse">
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div>Loading spaces...</div>
          ) : filteredSpaces.length === 0 ? (
            <div>No spaces found</div>
          ) : (
            filteredSpaces.map((space) => (
              <Col key={space.id} md={6} lg={12} className="mb-4">
                <Card
                  className="h-100 shadow-sm space"
                  as={Link}
                  to={`/spaces/${space.id}`}
                >
                  {/* <Link > */}
                  <Card.Body>
                    <Card.Title>{space.title}</Card.Title>
                    <Card.Text>{space.description}</Card.Text>
                    <div className="mb-3">
                      {space.tags.map((tag) => (
                        <Badge key={tag.id} bg="secondary" className="me-1">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                    {!space.is_owner && (
                      <Button
                        variant="primary"
                        onClick={() =>
                          space.is_contributor
                            ? handleLeaveSpace(space.id)
                            : handleJoinSpace(space.id)
                        }
                      >
                        {joiningSpace === space.id
                          ? "Processing..."
                          : space.is_contributor
                          ? "Leave Space"
                          : "Join Space"}
                      </Button>
                    )}
                  </Card.Body>
                  {/* </Link> */}
                </Card>
              </Col>
            ))
          )}
        </div>
      </div>
    </Container>
  );
}
