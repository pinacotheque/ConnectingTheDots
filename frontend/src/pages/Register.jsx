import { useState } from "react";
import { Container, Form } from "react-bootstrap";
import "../styles/auth.css";
import { registerUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(form);
      console.log("Registered", res);
      navigate("/login");
    } catch (error) {
      console.error("Register failed:", error.message);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <div className="main-form">
        <h2 className="text-center">Sign Up</h2>
        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Form.Group>
          <button type="submit">Sign Up</button>
        </Form>
        <p className="text-center mt-3">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </Container>
  );
}
