import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { post } from "./adminApi";

const AdminChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await post(
        "/auth/change-password",
        { currentPassword, password },
        { csrf: true }
      );
      setMessage(response.data.message);
      navigate("/admin/login", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to change Admin password.");
    }
  };

  return (
    <section className="admin-student-management admin-section-card">
      <div className="search-section-heading">
        <h2>Change Password</h2>
        <span>Choose at least 8 characters with uppercase, number, and symbol.</span>
      </div>
      {message && <p className="message-box">{message}</p>}
      {error && <p className="admin-auth-error" role="alert">{error}</p>}
      <form className="admin-student-edit" onSubmit={submit}>
        <label>
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>
        <label>
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>
        <div><button type="submit">Change password</button></div>
      </form>
    </section>
  );
};

export default AdminChangePassword;
