import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data.users || []))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load users"));
  }, []);

  return (
    <div className="dash-panel">
      <div className="dash-panel-head">
        <h2>All Users</h2>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

