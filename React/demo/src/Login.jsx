import { useState, useEffect } from "react";
import { getUsers } from "./taskService";
import "./Login.css";

function Login({ onLogin, onClose }) {
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const user = users.find(u => String(u.id) === String(userId));

    if (user) {
      onLogin(user);
    } else {
      setError(true);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <button className="close-x" onClick={onClose}>×</button>

        <h2>Select User</h2>

        {/* 🔥 Lista real de usuarios */}
        <div className="user-list">
          {users.map(u => (
            <button
              key={u.id}
              className="btn-user"
              onClick={() => onLogin(u)}
            >
              {u.name} (ID: {u.id})
            </button>
          ))}
        </div>

        {/* 🔥 Login por ID */}
        <form onSubmit={handleSubmit}>
          <input
            type="number"
            placeholder="Enter your user ID..."
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setError(false);
            }}
          />

          <button type="submit" className="btn-main">
            Enter
          </button>
        </form>

        {error && (
          <p style={{ color: "red" }}>
            User not found
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;