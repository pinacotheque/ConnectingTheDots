import { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import "../styles/auth.css";

export default function Login() {
  const [username, setUsername] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // await login({ username });
    } catch (error) {
      alert("Login failed");
    }
  };

  return (
    <Container className="d-flex">
      <div className="main-form">
        <h2 className="text-center mb-4">Login</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100">
            Login
          </Button>
        </Form>
        <p className="text-center mt-3">
          Don't have an account? <a href="/register">Sign Up</a>
        </p>
      </div>
    </Container>
  );
}
