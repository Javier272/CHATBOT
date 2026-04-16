import { useState } from "react";
import "./Login.css";

function Login({ onLogin, users, onRegister, onClose }) {
  const [name, setName] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Buscamos si el nombre ya está en nuestra "base de datos" local
    const userExists = users.find(u => u.name.toLowerCase() === name.toLowerCase());

    if (userExists) {
      onLogin(userExists);
    } else {
      // Si no existe, disparamos la opción de registro
      setError(true);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <button className="close-x" onClick={onClose}>×</button>
        <h2>Acceso de Usuario</h2>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Tu nombre aquí..." 
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(false);
            }}
          />
          <button type="submit" className="btn-main">Entrar</button>
        </form>

        {error && (
          <div className="new-user-zone">
            <p>No te encontré. ¿Quieres registrarte?</p>
            <button 
              className="btn-create" 
              onClick={() => onRegister(name)}
            >
              Crear cuenta y entrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;