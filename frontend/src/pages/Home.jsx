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
  Row,
} from "react-bootstrap";
import "../styles/home.css";
import searchIcon from "../assets/search.svg";
import { getSpaces, getTags } from "../api/auth";
import { Link } from "react-router-dom";

export default function Home() {
  const [spaces, setSpaces] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    fetchSpaces();
    fetchTags();
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

  const fetchTags = async () => {
    try {
      setTagsLoading(true);
      const tagsData = await getTags();
      setTags(tagsData);
    } catch (err) {
      console.error("Error fetching tags:", err);
    } finally {
      setTagsLoading(false);
    }
  };

  const handleTagSelect = (tagId) => {
    setSelectedTags((prevSelectedTags) => {
      if (prevSelectedTags.includes(tagId)) {
        return prevSelectedTags.filter((id) => id !== tagId);
      } else {
        return [...prevSelectedTags, tagId];
      }
    });
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  const filteredSpaces = spaces.filter((space) => {
    const matchesSearchQuery =
      searchQuery === "" ||
      space.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.tags.some((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesTags =
      selectedTags.length === 0 ||
      space.tags.some((tag) => selectedTags.includes(tag.id));

    return matchesSearchQuery && matchesTags;
  });

  return (
    <Container className="home">
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

        <div className="tags-container mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5>Filter by Tags</h5>
            {selectedTags.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearTagFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {tagsLoading ? (
            <p className="text-muted">Loading tags...</p>
          ) : (
            <div className="tags-list">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    bg={selectedTags.includes(tag.id) ? "primary" : "success"}
                    className="me-2 mb-2 clickable-tag"
                    onClick={() => handleTagSelect(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <p className="text-muted">No tags available</p>
              )}
            </div>
          )}
        </div>

        <div className="browse">
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div>Loading spaces...</div>
          ) : filteredSpaces.length === 0 ? (
            <div>No spaces found</div>
          ) : (
            <Row>
              {filteredSpaces.map((space) => (
                <Col key={space.id} md={6} lg={12} className="mb-4">
                  <Card
                    className="h-100 shadow-sm spaceCard"
                    as={Link}
                    to={`/spaces/${space.id}`}
                  >
                    <Card.Body>
                      <h4>{space.title}</h4>
                      <Card.Text>{space.description}</Card.Text>
                      <div className="mb-3">
                        {space.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            bg={
                              selectedTags.includes(tag.id)
                                ? "primary"
                                : "success"
                            }
                            className="me-1"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                      Created by {space.owner.username}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    </Container>
  );
}
