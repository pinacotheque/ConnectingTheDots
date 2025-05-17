import React, { useState } from "react";
import { Container, Form } from "react-bootstrap";
import "../styles/auth.css";
import { loginUser } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { setToken, setRefreshToken, setTokenExpiry } from "../utils/tokenManager";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(form);
      if (res.token) {
        setToken(res.token);
        setRefreshToken(res.refresh);
        setTokenExpiry(res.expires_in);
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  };

  return (
    <Container className="d-flex auth">
      <div className="main-form">
        <h2 className="text-center mb-4">Login</h2>
        <Form onSubmit={handleSubmit}>
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
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Form.Group>
          <button variant="primary" type="submit">
            Login
          </button>
        </Form>
        <p className="text-center mt-3">
          Don't have an account? <a href="/register">Sign Up</a>
        </p>
      </div>
    </Container>
  );
}
