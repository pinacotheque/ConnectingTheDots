import React, { useState } from 'react';
import {
  Button,
  Container,
  Form,
  Nav,
  Navbar,
  NavDropdown,
  Modal,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate } from 'react-router-dom';
import { createSpace } from '../api/auth';

function Navigation({ onSpaceCreated }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setShow(false);
    setForm({ title: "", description: "", tags: "" });
    setError(null);
  };

  const handleShow = () => setShow(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const tagIds = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const spaceData = {
        title: form.title,
        description: form.description,
        tag_ids: tagIds,
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
          <Navbar.Brand as={Link} to="/">ConnectingTheDots</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav
              className="me-auto my-2 my-lg-0"
              style={{ maxHeight: "100px" }}
              navbarScroll
            >
              <Nav.Link as={Link} to="/">Home</Nav.Link>
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
                <NavDropdown.Item as={Link} to="/profile">View Profile</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/logout">Logout</NavDropdown.Item>
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
              <Form.Control
                type="text"
                placeholder="Crime, Science, Plants etc."
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                disabled={loading}
              />
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
              <Button variant="secondary" onClick={handleClose} disabled={loading}>
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
