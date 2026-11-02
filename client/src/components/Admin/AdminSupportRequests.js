import { useEffect, useState } from "react";
import { FaClipboardList, FaSyncAlt } from "react-icons/fa";
import { get, put } from "./adminApi";

const statusOptions = ["New", "In Progress", "Waiting for Student", "Resolved"];

const AdminSupportRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await get("/support-requests");
      setRequests(Array.isArray(response.data?.requests) ? response.data.requests : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load academic support requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (requestId, nextStatus) => {
    if (!requestId || !nextStatus) return;

    try {
      setUpdatingId(requestId);
      const response = await put(`/support-requests/${requestId}/status`, { status: nextStatus });
      const updatedRequest = response.data?.request;
      if (updatedRequest) {
        setRequests((current) => current.map((request) => (request._id === requestId ? updatedRequest : request)));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update support request status.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div style={{ display: "grid", gap: "1.2rem", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", color: "#17663f", textTransform: "uppercase" }}>
            Student support
          </div>
          <h2 style={{ margin: "0.4rem 0 0", fontSize: "1.9rem", color: "#173c2a" }}>Academic Support Requests</h2>
        </div>
        <button type="button" onClick={fetchRequests} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "none", borderRadius: "12px", padding: "0.8rem 1rem", background: "linear-gradient(135deg, #0d6d3c, #24b86a)", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {error && (
        <div role="alert" style={{ padding: "0.8rem 1rem", borderRadius: "12px", background: "rgba(210, 59, 59, 0.08)", color: "#a12c2c", border: "1px solid rgba(210, 59, 59, 0.2)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "1rem", borderRadius: "16px", background: "#f3faf5", color: "#173c2a" }}>Loading support requests...</div>
      ) : requests.length === 0 ? (
        <div style={{ padding: "2rem", borderRadius: "18px", background: "#f3faf5", border: "1px solid rgba(17, 84, 50, 0.12)", color: "#5f7870", textAlign: "center" }}>
          <FaClipboardList style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }} />
          <div>No academic support requests have been submitted yet.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {requests.map((request) => (
            <div key={request._id} style={{ border: "1px solid rgba(17, 84, 50, 0.12)", borderRadius: "18px", background: "#fff", padding: "1.1rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between", flexWrap: "wrap", marginBottom: "0.8rem" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", color: "#17663f", textTransform: "uppercase" }}>{request.category}</div>
                  <h3 style={{ margin: "0.45rem 0 0", color: "#173c2a", fontSize: "1.25rem" }}>{request.subject}</h3>
                </div>
                <div style={{ minWidth: "180px" }}>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#5f7870", fontWeight: 700, marginBottom: "0.35rem" }}>Status</label>
                  <select
                    value={request.status || "New"}
                    onChange={(event) => handleStatusChange(request._id, event.target.value)}
                    disabled={updatingId === request._id}
                    style={{ width: "100%", border: "1px solid rgba(17, 84, 50, 0.12)", borderRadius: "10px", padding: "0.7rem 0.8rem", background: "#f9fcfa" }}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gap: "0.5rem", color: "#173c2a", fontSize: "0.95rem" }}>
                <div><strong>Student:</strong> {request.studentName || request.studentEmail}</div>
                <div><strong>Email:</strong> {request.studentEmail}</div>
                <div><strong>Student ID:</strong> {request.studentId || "Unavailable"}</div>
                <div><strong>Priority:</strong> {request.priority || "Medium"}</div>
                <div><strong>Preferred contact:</strong> {request.preferredContact || "Email"}</div>
                <div><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleString()}</div>
                <div style={{ marginTop: "0.5rem", padding: "0.9rem", borderRadius: "12px", background: "rgba(20, 131, 80, 0.04)", border: "1px solid rgba(20, 131, 80, 0.08)" }}>
                  <strong>Message:</strong>
                  <p style={{ margin: "0.5rem 0 0", color: "#5f7870", lineHeight: 1.6 }}>{request.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSupportRequests;
