import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import Welcome from "./components/Welcome";
import Login from "./components/Login";
import Register from "./components/Register";
import Forgetpass from "./components/Forgetpass";
import Emailver from "./components/Emailver";
import ChangePassword from "./components/ChangePassword";
import AdminAuth from "./components/AdminAuth";
import AdminForgotPassword from "./components/AdminForgotPassword";
import { ADMIN_ACCOUNTS } from "./adminAccounts";

vi.mock("axios");

const LocationDisplay = () => {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
};

const renderWithRouter = (ui, initialEntries = ["/"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="*" element={ui} />
        <Route path="/admin/login" element={<><AdminAuth /><LocationDisplay /></>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  axios.post.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("frontend pages", () => {
  it("renders the Welcome page with navbar and admin portal", () => {
    renderWithRouter(<Welcome />);

    expect(screen.getByText(/smarter student support/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /admin portal/i })).toBeInTheDocument();
  });

  it("shows Login validation errors", async () => {
    const { container } = renderWithRouter(<Login />);

    await userEvent.click(container.querySelector(".login-btn"));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("shows Register validation errors", async () => {
    const { container } = renderWithRouter(<Register />);

    await userEvent.click(container.querySelector(".register-btn"));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(screen.getByText("Confirm Password is required")).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("validates fixed admin email login and reaches dashboard route", async () => {
    const admin = ADMIN_ACCOUNTS[0];
    renderWithRouter(<><AdminAuth /><LocationDisplay /></>, ["/admin/login"]);

    await userEvent.type(screen.getByPlaceholderText("admin@example.com"), "not-admin@example.com");
    await userEvent.type(screen.getByPlaceholderText("Enter password"), "whatever");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("This email is not authorized as an admin.")).toBeInTheDocument();

    await userEvent.clear(screen.getByPlaceholderText("admin@example.com"));
    await userEvent.clear(screen.getByPlaceholderText("Enter password"));
    await userEvent.type(screen.getByPlaceholderText("admin@example.com"), admin.email.toUpperCase());
    await userEvent.type(screen.getByPlaceholderText("Enter password"), admin.defaultPassword);
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/admin/dashboard");
  });

  it("completes the admin forgot password demo flow", async () => {
    const admin = ADMIN_ACCOUNTS[0];
    renderWithRouter(<><AdminForgotPassword /><LocationDisplay /></>, ["/admin/forgot-password"]);

    await userEvent.type(screen.getByPlaceholderText("admin@example.com"), admin.email);
    await userEvent.click(screen.getByRole("button", { name: /send verification code/i }));

    expect(await screen.findByText(/demo verification code/i)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Enter verification code"), "000000");
    await userEvent.click(screen.getByRole("button", { name: /verify code/i }));
    expect(await screen.findByText(/verification code is incorrect/i)).toBeInTheDocument();

    await userEvent.clear(screen.getByPlaceholderText("Enter verification code"));
    await userEvent.type(screen.getByPlaceholderText("Enter verification code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /verify code/i }));

    await userEvent.type(screen.getByPlaceholderText("Create new password"), "NewAdmin@123");
    await userEvent.type(screen.getByPlaceholderText("Confirm new password"), "NewAdmin@123");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/admin/login");
  });

  it("navigates to /search after successful student login", async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        user: { name: "Test User" },
      },
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<><Login /><LocationDisplay /></>} />
          <Route path="/search" element={<LocationDisplay />} />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText("Enter your email"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await userEvent.click(container.querySelector(".login-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/search");
    });
  });

  it("requires OTP verification before showing the password reset page", async () => {
    axios.post
      .mockResolvedValueOnce({
        data: {
          success: true,
          message: "OTP has been sent.",
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          resetToken: "reset-token",
        },
      });

    render(
      <MemoryRouter initialEntries={["/forget-password"]}>
        <Routes>
          <Route path="/forget-password" element={<><Forgetpass /><LocationDisplay /></>} />
          <Route path="/verify" element={<><Emailver /><LocationDisplay /></>} />
          <Route path="/change-password" element={<LocationDisplay />} />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText("Email address or phone number"), "test@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/verify");
    });
    expect(screen.queryByText("123456")).not.toBeInTheDocument();
    expect(screen.queryByText(/your otp code/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).not.toHaveTextContent("/change-password");

    await userEvent.type(screen.getByPlaceholderText("OTP Code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /verify email/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/change-password");
    });
  });

  it("stays on forgot password page when OTP email sending fails", async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "Unable to send OTP email: SMTP rejected message",
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/forget-password"]}>
        <Routes>
          <Route path="/forget-password" element={<><Forgetpass /><LocationDisplay /></>} />
          <Route path="/verify" element={<LocationDisplay />} />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText("Email address or phone number"), "test@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send otp/i }));

    expect(await screen.findByText("Unable to send OTP email: SMTP rejected message")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/forget-password");
  });

  it("submits the verified reset password to the backend", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
      },
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/change-password",
            state: {
              email: "test@example.com",
              resetToken: "reset-token",
            },
          },
        ]}
      >
        <Routes>
          <Route path="/change-password" element={<><ChangePassword /><LocationDisplay /></>} />
          <Route path="/login" element={<LocationDisplay />} />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText("New Password"), "Newpass1234!");
    await userEvent.type(screen.getByPlaceholderText("Confirm Password"), "Newpass1234!");
    await userEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("http://127.0.0.1:3002/reset-password", {
        email: "test@example.com",
        resetToken: "reset-token",
        password: "Newpass1234!",
      });
    });
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
  });
});
