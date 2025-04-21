// src/pages/__tests__/Register.test.js
import { render, screen, fireEvent } from "@testing-library/react";
import Register from "../Register";
import { BrowserRouter } from "react-router-dom";

test("renders register form and submits data", () => {
    render(
        <BrowserRouter>
            <Register />
        </BrowserRouter>
    );

    const usernameInput = screen.getByPlaceholderText(/username/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole("button", { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "testpass123" } });

    fireEvent.click(submitButton);

});
