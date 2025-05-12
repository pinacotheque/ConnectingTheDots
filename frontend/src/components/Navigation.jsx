import React, { useState } from "react";
import {
  Button,
  Container,
  Form,
  Nav,
  Navbar,
  NavDropdown,
  Modal,
  Alert,
  ListGroup,
  Badge,
  Spinner,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { createSpace, searchWikidata } from "../api/auth";

function Navigation({ onSpaceCreated }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: [],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleClose = () => {
    setShow(false);
    setForm({ title: "", description: "", tags: [] });
    setError(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleShow = () => setShow(true);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;

    setSearchLoading(true);
    try {
      const results = await searchWikidata(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError("Failed to search Wikidata");
      console.error("Error searching Wikidata:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleTagSelect = (tag) => {
    if (!form.tags.some((t) => t.wikidata_id === tag.wikidata_id)) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleTagRemove = (wikidataId) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.wikidata_id !== wikidataId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const spaceData = {
        title: form.title,
        description: form.description,
        tags: form.tags.map(tag => ({
          wikidata_id: tag.wikidata_id,
          name: tag.label,
          description: tag.description
        }))
      };

      await createSpace(spaceData);
      handleClose();
      if (onSpaceCreated) {
        onSpaceCreated();
      }
    } catch (error) {
      console.error("Failed to create space:", error);
      setError("Failed to create space. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container fluid>
          <Navbar.Brand as={Link} to="/">
            ConnectingTheDots
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav
              className="me-auto my-2 my-lg-0"
              style={{ maxHeight: "100px" }}
              navbarScroll
            >
              <Nav.Link as={Link} to="/">
                Home
              </Nav.Link>
            </Nav>
            <Button variant="primary" onClick={handleShow}>
              Create a Space
            </Button>
            <Nav>
              <NavDropdown
                align="end"
                title="Profile"
                id="navbarScrollingDropdown"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  View Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/logout">
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create a Space</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="spaceTitle">
              <Form.Label>Space Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Where is the cat?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="spaceTags">
              <Form.Label>Add Tags</Form.Label>
              <div className="mb-2">
                {form.tags.map((tag) => (
                  <Badge
                    key={tag.wikidata_id}
                    bg="secondary"
                    className="me-2 mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleTagRemove(tag.wikidata_id)}
                  >
                    {tag.label} ×
                  </Badge>
                ))}
              </div>
              <div className="d-flex mb-2">
                <Form.Control
                  type="text"
                  placeholder="Search Wikidata for tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
                <Button
                  variant="outline-secondary"
                  onClick={handleSearch}
                  disabled={searchLoading || searchQuery.length < 2}
                  className="ms-2"
                >
                  {searchLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
              {searchResults.length > 0 && (
                <ListGroup>
                  {searchResults.map((result) => (
                    <ListGroup.Item
                      key={result.wikidata_id}
                      action
                      onClick={() => handleTagSelect(result)}
                    >
                      <h6 className="mb-0">{result.label}</h6>
                      {result.description && (
                        <small className="text-muted">
                          {result.description}
                        </small>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Form.Group>
            <Form.Group className="mb-3" controlId="spaceDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
                disabled={loading}
              />
            </Form.Group>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Discard
              </Button>
              <Button variant="success" type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default Navigation;
