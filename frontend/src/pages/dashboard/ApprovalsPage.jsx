import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

export default function ApprovalsPage() {
  const [pendingEmployers, setPendingEmployers] = useState([]);
  const [rejectReasonById, setRejectReasonById] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const pendingRes = await api.get("/admin/pending-employers");
    setPendingEmployers(pendingRes.data.pendingEmployers || []);
  }

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || "Failed to load approvals."));
  }, []);

  const serverBase = useMemo(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    try {
      return new URL(apiBase).origin;
    } catch {
      return "http://localhost:5000";
    }
  }, []);

  async function handleDecision(employerId, status) {
    setError("");
    setMessage("");
    try {
      const reason = rejectReasonById[employerId] || "";
      const { data: response } = await api.patch(`/admin/employers/${employerId}/status`, {
        status,
        reason,
      });

      if (response.emailSent) {
        const successMessage = `Employer registration ${status}. Mail sent successfully to ${response.employer.email}.`;
        setMessage(successMessage);
        window.alert(successMessage);
      } else {
        const failureMessage = `Employer registration ${status}, but mail was not sent.\nReason: ${
          response.emailWarning || "Unknown email error"
        }`;
        setMessage(failureMessage);
        window.alert(failureMessage);
      }

      await load();
    } catch (err) {
      const backendMessage = err.response?.data?.message || "Failed to update employer status.";
      setError(backendMessage);
      window.alert(`Action failed.\nReason: ${backendMessage}`);
    }
  }

  return (
    <div>
      <h1 className="dash-title">Employer Approvals</h1>
      <p className="dash-muted">Review pending employer registrations and approve or reject.</p>
      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="dash-panel">
        {pendingEmployers.length === 0 ? (
          <p className="dash-muted">No pending employer registrations.</p>
        ) : (
          <div className="dash-approvals">
            {pendingEmployers.map((emp) => (
              <div key={emp._id} className="dash-approval-card">
                <div className="dash-approval-head">
                  <div className="dash-avatar">{emp.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <p className="dash-list-title">{emp.name}</p>
                    <p className="dash-muted">{emp.email}</p>
                    <p className="dash-muted">{emp.companyName}</p>
                    {emp.employerProofDocument ? (
                      <p className="dash-muted">
                        Proof:{" "}
                        <a
                          className="dash-link-inline"
                          href={`${serverBase}${emp.employerProofDocument}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View file
                        </a>
                      </p>
                    ) : (
                      <p className="dash-muted">Proof: not uploaded</p>
                    )}
                  </div>
                  <span className="dash-tag warning">pending</span>
                </div>

                <textarea
                  rows={2}
                  placeholder="Reason (required only for reject)"
                  value={rejectReasonById[emp._id] || ""}
                  onChange={(e) =>
                    setRejectReasonById((prev) => ({ ...prev, [emp._id]: e.target.value }))
                  }
                />
                <div className="row">
                  <button className="btn" onClick={() => handleDecision(emp._id, "approved")}>
                    Approve
                  </button>
                  <button className="btn danger" onClick={() => handleDecision(emp._id, "rejected")}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

