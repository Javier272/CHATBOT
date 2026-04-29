const BASE_URL = "http://160.34.219.37";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }) // evita mandar "Bearer null"
  };
};

//  Helper para manejar respuestas
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

// Obtener tareas
export const getTasks = async () => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

// Crear tarea
export const createTask = async (task) => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(task)
  });

  return handleResponse(res);
};

// Actualizar tarea
export const updateTask = async (task) => {
  const res = await fetch(`${BASE_URL}/tasks/${task.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(task)
  });

  return handleResponse(res);
};

// Eliminar tarea
export const deleteTask = async (id) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  return handleResponse(res);
};

// Obtener usuarios
export const getUsers = async () => {
  const res = await fetch(`${BASE_URL}/users`);
  return handleResponse(res);
};

// Crear usuario
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

// Obtener sprints
export const getSprints = async () => {
  try {
    const res = await fetch(`${BASE_URL}/sprints`);
    return await handleResponse(res);
  } catch (error) {
    console.error("❌ Error sprints:", error);
    return [];
  }
};

// LOGIN
export const loginUser = async ({ email, password }) => {
  try {
    console.log("Enviando login:", { email, password });

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

    // Diferenciar error de conexión
    if (error.message === "Failed to fetch") {
      throw new Error("Connection error");
    }

    throw error;
  }
};