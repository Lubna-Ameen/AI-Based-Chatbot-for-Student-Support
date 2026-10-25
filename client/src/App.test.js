import { render, screen, waitFor, within } from "@testing-library/react";
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
import AdminAuth from "./components/Admin/AdminAuth";
import AdminForgotPassword from "./components/Admin/AdminForgotPassword";
import AdminPage from "./components/Admin/AdminPage";
import StudentDashboard from "./components/StudentDashboard/StudentDashboard";
import { ADMIN_ACCOUNTS } from "./components/Admin/adminAccounts";

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
  axios.get.mockReset();
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
    expect(screen.getByText("Student ID is required")).toBeInTheDocument();
    expect(screen.getByText("Program is required")).toBeInTheDocument();
    expect(screen.getByText("Academic year is required")).toBeInTheDocument();
    expect(screen.getByText("Department is required")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Department" })).toHaveDisplayValue("Select Your Department");
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(screen.getByText("Confirm Password is required")).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("validates fixed admin email login and reaches dashboard route", async () => {
    const admin = ADMIN_ACCOUNTS[0];
    renderWithRouter(<><AdminAuth /><LocationDisplay /></>, ["/admin/login"]);

    axios.post
      .mockRejectedValueOnce({
        response: { data: { message: "Invalid Admin email or password" } },
      })
      .mockResolvedValueOnce({
        data: { success: true, csrfToken: "test-csrf-token" },
      });

    await userEvent.type(screen.getByPlaceholderText("admin@example.com"), "not-admin@example.com");
    await userEvent.type(screen.getByPlaceholderText("Enter password"), "whatever");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Invalid Admin email or password")).toBeInTheDocument();

    await userEvent.clear(screen.getByPlaceholderText("admin@example.com"));
    await userEvent.clear(screen.getByPlaceholderText("Enter password"));
    await userEvent.type(screen.getByPlaceholderText("admin@example.com"), admin.email.toUpperCase());
    await userEvent.type(screen.getByPlaceholderText("Enter password"), "existing-admin-password");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/admin/dashboard");
    });
    expect(axios.post).toHaveBeenLastCalledWith(
      "http://localhost:3002/admin/auth/login",
      { email: admin.email.toUpperCase(), password: "existing-admin-password" },
      expect.objectContaining({ withCredentials: true })
    );
  });

  it("explains when the Admin login endpoint is unavailable", async () => {
    axios.post.mockRejectedValue({
      response: { status: 404, data: {} },
    });
    renderWithRouter(<AdminAuth />, ["/admin/login"]);

    await userEvent.type(screen.getByPlaceholderText("admin@example.com"), ADMIN_ACCOUNTS[0].email);
    await userEvent.type(screen.getByPlaceholderText("Enter password"), "diagnostic-password");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/admin sign-in endpoint is unavailable/i)).toBeInTheDocument();
  });

  it("shows all Admin sections and supports sidebar collapse and navigation", async () => {
    axios.get.mockResolvedValue({
      data: { admin: { email: "admin@example.com", displayName: "Admin User", title: "Administrator" } },
    });
    renderWithRouter(<><AdminPage><p>Admin content</p></AdminPage><LocationDisplay /></>, ["/admin/dashboard"]);

    const sections = [
      "Overview",
      "Students",
      "Academic Records",
      "Profile",
      "Reports",
      "Risk Monitoring",
      "Change Password",
    ];
    for (const label of sections) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: "Logout" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Notifications are not configured" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(document.querySelector(".admin-sidebar")).toHaveClass("is-mobile-open");
    await userEvent.click(screen.getByRole("button", { name: "Close navigation menu" }));
    expect(document.querySelector(".admin-sidebar")).not.toHaveClass("is-mobile-open");

    await userEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    expect(document.querySelector(".admin-portal-shell")).toHaveClass("is-sidebar-collapsed");

    const paths = [
      "/admin/dashboard",
      "/admin/students",
      "/admin/academic-records",
      "/admin/profile",
      "/admin/reports",
      "/admin/risk-monitoring",
      "/admin/change-password",
    ];
    for (let index = 0; index < sections.length; index += 1) {
      await userEvent.click(screen.getByRole("link", { name: sections[index] }));
      await waitFor(() => {
        expect(screen.getByTestId("location")).toHaveTextContent(paths[index]);
      });
    }
  });

  it("completes the admin forgot password demo flow", async () => {
    const admin = ADMIN_ACCOUNTS[0];
    renderWithRouter(<><AdminForgotPassword /><LocationDisplay /></>, ["/admin/forgot-password"]);

    axios.post
      .mockResolvedValueOnce({ data: { success: true } })
      .mockResolvedValueOnce({ data: { success: true, resetToken: "server-reset-token" } })
      .mockResolvedValueOnce({ data: { success: true } });

    await userEvent.type(screen.getByPlaceholderText("admin@example.com"), admin.email);
    await userEvent.click(screen.getByRole("button", { name: /send verification code/i }));

    expect(await screen.findByText(/verification code sent to your admin email/i)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Enter verification code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /verify code/i }));

    await screen.findByPlaceholderText("Create new password");
    await userEvent.type(screen.getByPlaceholderText("Create new password"), "NewAdmin@123");
    await userEvent.type(screen.getByPlaceholderText("Confirm new password"), "NewAdmin@123");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/admin/login");
    });
  });

  it("redirects to /student/dashboard after successful student login", async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        user: { _id: "user-123", name: "Test User", email: "test@test.com" },
      },
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<><Login /><LocationDisplay /></>} />
          <Route path="/student/dashboard" element={<LocationDisplay />} />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText("Enter your email"), "test@test.com");
    await userEvent.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await userEvent.click(container.querySelector(".login-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/student/dashboard");
    });
  });

  it("redirects to /student/dashboard after successful student registration", async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        user: { _id: "user-456", name: "New Student", email: "newstudent@test.com" },
      },
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<><Register /><LocationDisplay /></>} />
          <Route path="/student/dashboard" element={<LocationDisplay />} />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText("Name is required"), "New Student");
    await userEvent.type(screen.getByPlaceholderText("Email is required"), "newstudent@test.com");
    await userEvent.type(screen.getByPlaceholderText("Student ID"), "STU-1001");
    await userEvent.type(screen.getByPlaceholderText("Phone number"), "5551234567");
    await userEvent.type(screen.getByPlaceholderText("Program"), "Computer Science");
    await userEvent.type(screen.getByPlaceholderText("Academic year"), "2026");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Department" }), "Engineering");
    await userEvent.type(screen.getAllByPlaceholderText("Password is required")[0], "password123");
    await userEvent.type(screen.getByPlaceholderText("Confirm your password"), "password123");
    await userEvent.click(container.querySelector(".register-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/student/dashboard");
    });
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:3002/register",
      expect.objectContaining({ department: "Engineering" })
    );
  });

  it("shows the saved department in the student profile", async () => {
    localStorage.setItem(
      "studentUser",
      JSON.stringify({ _id: "student-1", email: "student@example.com" })
    );
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "student-1",
          name: "Test Student",
          email: "student@example.com",
          role: "student",
          department: "Information Technology (IT)",
        },
      ],
    });

    renderWithRouter(<StudentDashboard />, ["/student/dashboard"]);

    const profileHeading = await screen.findByRole("heading", {
      name: "Test Student",
      level: 2,
    });
    const profile = profileHeading.closest("#my-profile");
    expect(
      await within(profile).findByText("Information Technology (IT)")
    ).toBeInTheDocument();
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
          <Route path="/reset-password" element={<LocationDisplay />} />
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
    await userEvent.click(screen.getByRole("button", { name: /verify code/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/reset-password");
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
            pathname: "/reset-password",
            state: {
              email: "test@example.com",
              resetToken: "reset-token",
            },
          },
        ]}
      >
        <Routes>
          <Route path="/reset-password" element={<><ChangePassword /><LocationDisplay /></>} />
          <Route path="/login" element={<LocationDisplay />} />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText("New Password"), "Newpass1234!");
    await userEvent.type(screen.getByPlaceholderText("Confirm Password"), "Newpass1234!");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

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
