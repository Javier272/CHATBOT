let data = {
  // Usuario por defecto al arrancar
  currentUser: { },
  users: [
    { id: 1, name: "pepito" },
    { id: 2, name: "maria" }
  ],
  tasks: [
    { id: 1, title: "Configurar Oracle", date: "2026-04-20", priority: "High", completed: false, description: "...", started: false, responsableId: 1 },
    { id: 2, title: "Diseñar UI", date: "2026-04-22", priority: "Medium", completed: false, description: "...", started: true, responsableId: 2 },
    { id: 3, title: "Didwdaw", date: "2026-04-22", priority: "Medium", completed: true, description: "...", started: true, responsableId: 1 }
  ]
};

export const getTasks = () => data.tasks;
export const getCurrentUser = () => data.currentUser;
export const getUsers = () => data.users;

// Cambia el estado global del usuario logueado
export const setCurrentUser = (user) => {
  data.currentUser = user;
};

// Crea un usuario nuevo y le asigna el siguiente ID disponible
export const addUser = (name) => {
  const newUser = {
    id: data.users.length + 1,
    name: name
  };
  data.users.push(newUser);
  return newUser;
};

export const setTasks = (newTasks) => {
  data.tasks = newTasks;
};