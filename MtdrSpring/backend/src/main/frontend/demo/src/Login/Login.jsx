import { useState } from "react";
import { loginUser } from "../taskService";
import "./Login.css";

function Login({ onLogin, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    console.log("Intentando login...");
    setLoading(true);
    setError(false);

    try {
      // loginUser ya guarda el token en localStorage internamente
      const data = await loginUser({ email, password });
      
      console.log("Login correcto:", data);

      // Guardar otros datos necesarios
      localStorage.setItem("userId", data.id);

      // Avisar al componente padre (App.jsx)
      onLogin(data);
      onClose(); // Cerrar modal si es necesario

    } catch (err) {
      console.error("Error en login:", err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <button className="close-x" onClick={onClose}>×</button>
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Enter your email..."
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(false);
          }}
        />

        <input
          type="password"
          placeholder="Enter your password..."
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
        />

        <button
          type="button"
          className="btn-main"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Loading..." : "Login"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>
            Invalid email or password
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;