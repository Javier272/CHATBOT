import { useState } from "react";
import { adminResetPassword } from "../taskService"; 
import "./Login.css";

function ChangePassword({ users, onClose }) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // --- ESTA ES LA FUNCIÓN QUE FALTABA ---
  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };
  // --------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const userSeleccionado = users.find(u => u.id == selectedUserId);

    if (!userSeleccionado) {
      alert("Por favor, selecciona un usuario.");
      return;
    }

    try {
      setLoading(true);
      // Enviamos el email y la contraseña como espera el backend
      await adminResetPassword(userSeleccionado.email, passwords.newPassword);
      
      alert("¡Contraseña actualizada con éxito!");
      onClose();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Cambiar Contraseña</h2>
        <form onSubmit={handleSubmit}>
          
          <label>Selecciona el usuario:</label>
          <select 
            value={selectedUserId} 
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
          >
            <option value="">-- Selecciona --</option>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>

          <input
            type="password"
            name="newPassword"
            placeholder="Nueva contraseña"
            value={passwords.newPassword}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar nueva contraseña"
            value={passwords.confirmPassword}
            onChange={handleChange}
            required
          />

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <div className="modal-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;