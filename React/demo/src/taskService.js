const BASE_URL = "http://163.192.141.169";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// 🧠 Helper de respuestas
const handleResponse = async (res) => {
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.error("❌ Error:", res.status, data);
    throw new Error(data?.message || "Request error");
  }

  return data;
};

//
// 📌 TASKS
//
// Temporal: Añade esto en getTasks
export const getTasks = async () => {
  const token = localStorage.getItem("token");
  console.log("Token enviado:", token); // Verifícalo en consola
  
  const res = await fetch(`${BASE_URL}/tasks`, {
    headers: getAuthHeaders()
  });

  // Loguea el estado para ver qué ocurre exactamente
  console.log("Respuesta del servidor:", res.status); 
  
  return handleResponse(res);
};

export const createTask = async (task) => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(task)
  });

  return handleResponse(res);
};

export const updateTask = async (task) => {
  const res = await fetch(`${BASE_URL}/tasks/${task.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(task)
  });

  return handleResponse(res);
};

export const deleteTask = async (id) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  return handleResponse(res);
};

//
// 👥 USERS
//
export const getUsers = async () => {
  const res = await fetch(`${BASE_URL}/users`, {
    headers: getAuthHeaders()
  });

  return handleResponse(res);
};

export const createUser = async (user) => {
  const res = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(user)
  });

  return handleResponse(res);
};

//
// 🚫 SPRINTS ELIMINADO (ya no existe)
//

//
// 🔐 LOGIN
//
export const loginUser = async ({ email, password }) => {
  try {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await handleResponse(res);

    console.log("Login correcto:", data);

    return data;

  } catch (error) {
    console.error("Error login:", error.message);

    if (error.message === "Failed to fetch") {
      throw new Error("Connection error");
    }

    throw error;
  }
};

// 🤖 Obtener prioridades sugeridas por IA
export const getAiPriorities = async (userId) => {
  const res = await fetch(`${BASE_URL}/ai/prioritize/user/${userId}`, {
    method: "GET",
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

// 📊 Obtener estadísticas y feedback del Agile Coach (IA)
export const getAiStats = async (userId) => {
  const res = await fetch(`${BASE_URL}/ai/stats/user/${userId}`, {
    method: "GET",
    headers: getAuthHeaders() // ¡Súper importante para que el cadenero te deje pasar!
  });
  
  return handleResponse(res);
};

export const updatePassword = async (userId, oldPassword, newPassword) => {
  // Ajusta la URL y el método según tu API
  const response = await fetch(`${BASE_URL}/users/${userId}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  
  if (!response.ok) throw new Error("No se pudo actualizar");
  return response.json();
};

export const adminResetPassword = async (email, newPassword) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/users/reset-password`, { // Asegúrate de usar la URL correcta
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ email, newPassword })
  });

  if (!res.ok) {
    const errorData = await res.text().catch(() => "Error desconocido");
    throw new Error(errorData || "Error al actualizar la contraseña");
  }

  return res.text(); 
};