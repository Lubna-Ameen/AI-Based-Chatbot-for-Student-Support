import { useEffect, useState } from "react";
import { get, put } from "./adminApi";

const AdminProfile = () => {
  const [profile, setProfile] = useState({ email: "", displayName: "", title: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    get("/auth/me")
      .then((response) => setProfile(response.data.admin))
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Unable to load Admin profile.")
      );
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await put("/profile", {
        displayName: profile.displayName,
        title: profile.title,
      });
      setProfile(response.data.admin);
      setMessage("Admin profile updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update Admin profile.");
    }
  };

  return (
    <section className="admin-student-management admin-section-card">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">ACCOUNT SETTINGS</p>
          <h2>Admin Profile</h2>
          <p>Update the display information associated with your account.</p>
        </div>
      </div>
      {message && <p className="message-box">{message}</p>}
      {error && <p className="admin-auth-error" role="alert">{error}</p>}
      <div className="admin-profile-summary">
        <span className="admin-profile-avatar">{(profile.displayName || profile.email || "A").charAt(0).toUpperCase()}</span>
        <div><strong>{profile.displayName || "Administrator"}</strong><span>{profile.email || "Loading account…"}</span></div>
      </div>
      <form className="admin-student-edit admin-profile-form" onSubmit={saveProfile}>
        <label>
          Email
          <input value={profile.email || ""} readOnly />
        </label>
        <label>
          Display name
          <input
            value={profile.displayName || ""}
            maxLength={100}
            onChange={(event) =>
              setProfile({ ...profile, displayName: event.target.value })
            }
          />
        </label>
        <label>
          Title
          <input
            value={profile.title || ""}
            maxLength={100}
            onChange={(event) => setProfile({ ...profile, title: event.target.value })}
          />
        </label>
        <div className="admin-form-actions"><button type="submit" className="admin-primary-button">Save profile</button></div>
      </form>
    </section>
  );
};

export default AdminProfile;
