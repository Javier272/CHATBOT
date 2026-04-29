const BASE_URL = "http://163.192.143.182";


// 📥 Obtener tareas
export const getTasks = async () => {
  const res = await fetch(`${BASE_URL}/tasks`);
  return await res.json();
};

// ➕ Crear tarea
export const createTask = async (task) => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(task)
  });

  return await res.json();
};

// 🔄 Actualizar tarea
export const updateTask = async (task) => {
  return fetch(`${BASE_URL}/tasks/${task.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(task)
  });
};

// 🗑️ Eliminar tarea
export const deleteTask = async (id) => {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE"
  });
};



// 📥 Obtener usuarios
export const getUsers = async () => {
  const res = await fetch(`${BASE_URL}/users`);
  return await res.json();
};

// ➕ Crear usuario (opcional)
export const createUser = async (user) => {
  const res = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(user)
  });

  return await res.json();
};