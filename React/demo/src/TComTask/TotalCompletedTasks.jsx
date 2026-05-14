// useState para manejar estados dinámicos
// useMemo para memorizar cálculos y evitar recalcular innecesariamente
import { useMemo, useState } from "react";
import { getAiStats } from "../taskService"; // FUNCIÓN QUE HACE LA PETICIÓN A LA IA
import "./TotalCompletedTasks.css";

 
// COMPONENTE PRINCIPAL
function TotalCompletedTasks({ tasks = [], users = [], currentUser = null }) {

  
// ESTADOS PARA LA IA
  // ==============================
  // Aquí guardamos la respuesta generada por la IA
  const [aiSuggestion, setAiSuggestion] = useState("");
  // Estado para saber si la IA sigue cargando
  const [isAiLoading, setIsAiLoading] = useState(false);


// AGRUPAR TAREAS POR SPRINT
  // ==============================
  /*
    useMemo evita recalcular esto cada render.

    Lo que hace:
    - Recorre todas las tareas
    - Las agrupa por sprint
    - Devuelve un objeto así:

    {
      Sprint1: [task1, task2],
      Sprint2: [task3]
    }
  */
  const tasksBySprint = useMemo(() => {
    // Validamos que tasks sea un arreglo
    if (!Array.isArray(tasks)) return {};
    // reduce() agrupa tareas
    return tasks.reduce((acc, task) => {
      const sprint = task?.sprint || "Sin Sprint";   // Si no tiene sprint -> "Sin Sprint"

      // Si el sprint aún no existe en el objeto
      if (!acc[sprint]) acc[sprint] = []; 
      // Agrega la tarea al sprint correspondiente
      acc[sprint].push(task);
      return acc;
    }, {});
  }, [tasks]);


// OBTENER NOMBRE DEL USUARIO
  // ==============================
  /*
    Busca un usuario por ID y devuelve su nombre
  */
const getUserName = (id) => {
  if (!users || !Array.isArray(users)) return "Unknown";
  // Buscamos el usuario probando todas las variantes de ID posibles
  const user = users.find(
    u => String(u.USER_ID || u.user_id || u.id) === String(id)
  );
  return user ? (user.name || user.USERNAME || user.userName) : "Unassigned";
};



  // FILTRAR SPRINTS
  // ============================== 
  /*
    Si no tiene sprint asignado, no se muestra
  */
  const sprintEntries =
    Object.entries(tasksBySprint).filter(
      ([sprintName]) =>
        sprintName !== "Sin Sprint"
  );
  // SI NO HAY DATOS
  if (sprintEntries.length === 0) {

    return (
      <div className="pending-wrapper">
        <p>
          Cargando datos... / sin tareas disponibles
        </p>
      </div>
    );
  }


  // FUNCIÓN PARA PEDIR FEEDBACK A IA
  const handleAskAI = async () => {
    /*
      Intentamos usar:
      1. currentUser
      2. o el usuario guardado en localStorage
    */
    const userToUse =
      currentUser ||
      JSON.parse(localStorage.getItem("user"));

    // Si no hay usuario logueado
    if (!userToUse || !userToUse.id) {

      alert(
        "Por favor inicia sesión para que la IA analice tus datos."
      );

      return;
    }

    // Activamos loading
    setIsAiLoading(true);

    // Limpiamos respuesta anterior
    setAiSuggestion("");

    try {

      // Llamamos a la IA
      const response = await getAiStats(userToUse.id);

      // Guardamos respuesta
      setAiSuggestion(response);

    } catch (error) {

      // Error de la IA
      console.error("Error con la IA:", error);

      setAiSuggestion(
        "Uy, Gemini está descansando. Intenta de nuevo más tarde."
      );

    } finally {

      // Quitamos loading siempre
      setIsAiLoading(false);
    }
  };

   
  // ==============================
  // RENDER PRINCIPAL
  // ==============================
  return (

    <div className="pending-wrapper">

      {/* TÍTULO PRINCIPAL */}
      <h2 className="pending-title-main">
        Tasks Dashboard by Sprint
      </h2>

      {/* RECORRE TODOS LOS SPRINTS */}
      {sprintEntries.map(([sprintName, sprintTasks]) => {
      // ESTADÍSTICAS POR USUARIO
        /*
          Crea estadísticas individuales:

          - tareas completadas
          - tareas iniciadas
          - pendientes
          - horas estimadas
          - horas reales
        */
console.log("USERS:", users);
console.log("SPRINT TASKS:", sprintTasks);

const userStats = (users || [])
  // Agregamos el filtro para excluir al usuario "prueba"
  .filter(u => {
    const userName = String(u.NAME || u.name || "").trim().toLowerCase();
    return userName !== "prueba";
  })
  .reduce((stats, u) => {
    // Limpiamos las comillas extras que vimos en el log (ej: "'pending'")
    const clean = (val) => String(val || "").replace(/['"]+/g, '').trim().toLowerCase();

    const currentUserId = u.USER_ID || u.user_id || u.id;
    const currentUserName = clean(u.NAME || u.name);

    // 1. Filtramos comparando SOLO por el nombre del usuario
    const userTasks = (sprintTasks || []).filter(t => {
      const taskOwner = clean(t.userName || t.USERNAME);
      return taskOwner !== "" && taskOwner === currentUserName;
    });

    // 2. Contamos los estados
    stats[currentUserId] = {
      completed: userTasks.filter(t => clean(t.STATUS || t.status) === "completed").length,
      started: userTasks.filter(t => {
        const s = clean(t.STATUS || t.status);
        return s === "in_progress" || s === "started";
      }).length,
      pending: userTasks.filter(t => clean(t.STATUS || t.status) === "pending").length,
      total: userTasks.length,

      // Mantenemos tu lógica de horas que dijiste que funciona bien
      estimatedHours: userTasks.reduce((a, t) => a + (Number(t.hoursEstimate) || 0), 0),
      actualHours: userTasks.reduce((a, t) => a + (Number(t.realHours) || 0), 0)
    };

    return stats;
  }, {});

// 4. Cálculo de máximos dinámicos
const maxTasks = Math.max(...Object.values(userStats).map(u => u.total), 1);
const maxHours = Math.max(...Object.values(userStats).map(u => Math.max(u.estimatedHours, u.actualHours)), 1);







// GENERAR TICKS DEL EJE Y
        // ==============================
        /*
          Genera marcas del eje Y:
          100 
          75
          50
          25
          0
        */
        const getTicks = (max) =>
          Array.from(
            { length: 5 },
            (_, i) =>
              Math.round(
                max - (i * (max / 4))
              )
          );


        // ==============================
        // RENDER DEL SPRINT
        // ==============================
console.log("USERS:", users);
console.log("TASKS:", tasks);
console.log("SPRINT TASKS:", sprintTasks);
        return (

          <section
            key={sprintName}
            className="sprint-group"
          >
            {/* TÍTULO DEL SPRINT */}
            <h3 className="sprint-title">
              {`Sprint ${sprintName}`}
            </h3>

            {/* CONTENEDOR PRINCIPAL */}
            <div className="sprint-dashboard-layout">

             
              {/* PANEL DE HORAS
              ============================== */}
              <div className="bar-chart-section">
                <h4 className="chart-title">Est. vs Actual Hours</h4>
                <div className="chart-with-axis">

                  {/* Eje Y: Números y líneas de fondo */}
                 <div className="axis-y">
                    {getTicks(maxHours).map((t, index) => (
                      /* Agregamos el nombre del sprint y el índice para asegurar unicidad */
                      <div key={`hours-tick-${sprintName}-${t}-${index}`} className="axis-tick">
                        <span>{t}h</span>
                        <div className="grid-line"></div>
                      </div>
                    ))}
                  </div>

                  <div className="chart-scroll-wrapper">
                      <div className="bar-chart-viewport">
                        {Object.keys(userStats).map((userId) => {
                          const { estimatedHours = 0, actualHours = 0 } = userStats[userId] || {};
                          const divisor = maxHours || 1;
                          
                          // SOLUCIÓN: Key compuesta única para este Sprint y este Usuario
                          const uniqueKey = `hours-bar-${sprintName}-${userId}`;


                          return (
                            <div key={uniqueKey} className="bar-chart-group">
                              <div className="bars-vertical-container">

                                {/* Barra Estimada: altura proporcional al máximo */}
                                <div className="bar-track-wrapper">
                                  <div className="bar-fill estimated" style={{
                                     height: `${(estimatedHours / divisor) * 100}%` 
                                     }}></div>
                                </div>

                                {/* Barra Real: altura proporcional al máximo */}
                                <div className="bar-track-wrapper">
                                  <div className="bar-fill actual" style={{ 
                                    height: `${(actualHours / divisor) * 100}%` 
                                    }}></div>
                                </div>
                              </div>
                              {/* Nombre del usuario debajo de sus barras */}
                              <span className="chart-user-name">{getUserName(userId)}</span>
                            </div>
                          );
                        })}
                      </div>
                  </div>
                </div>

                {/* Leyenda de colores */}
                <div className="chart-legend-details">
                  <span className="legend-item"><span className="dot-estimated"></span> Est.</span>
                  <span className="legend-item"><span className="dot-actual"></span> Actual</span>
                </div>
              </div>

               {/* ==============================
                  PANEL DE TAREAS
              ============================== */}
              <div className="bar-chart-section">
                {/* Título dinámico que muestra el máximo de tareas actual */}
                <h4 className="chart-title">Tasks per user (Max: {maxTasks})</h4>
                
                <div className="chart-with-axis">
                  {/* Eje Y: Marcas numéricas para contar tareas */}
                  <div className="axis-y">
                    {getTicks(maxTasks).map((t, i) => (
                      /* Combinamos valor e índice para una key única */
                      <div key={`tick-task-${t}-${i}`} className="axis-tick">
                        <span>{t}</span>
                        <div className="grid-line"></div>
                      </div>
                    ))}
                  </div>

                  <div className="chart-scroll-wrapper">
                    <div className="bar-chart-viewport">
                      {Object.keys(userStats).map((userId) => {
                        const { completed, started, pending } = userStats[userId];
                        const divisor = maxTasks || 1; // Evita errores si no hay tareas

                        const uniqueKey = `tasks-bar-${sprintName}-${userId}`;

                        return (
                          <div key={uniqueKey} className="bar-chart-group">
                            {/* Contenedor de las 3 barras de estado */}
                            <div className="bars-vertical-container">
                              {/* Barra de Completadas */}
                              <div className="bar-track-wrapper">
                                <div 
                                  className="bar-fill completed" 
                                  style={{ height: `${(completed / divisor) * 100}%` }}
                                ></div>
                              </div>
                              {/* Barra de En Progreso / Iniciadas */}
                              <div className="bar-track-wrapper">
                                <div 
                                  className="bar-fill started" 
                                  style={{ height: `${(started / divisor) * 100}%` }}
                                ></div>
                              </div>
                              {/* Barra de Pendientes */}
                              <div className="bar-track-wrapper">
                                <div 
                                  className="bar-fill pending" 
                                  style={{ height: `${(pending / divisor) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            {/* Identificador del usuario */}
                            <span className="chart-user-name">{getUserName(userId)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Leyenda para identificar qué significa cada color */}
                <div className="chart-legend-details">
                  <span className="legend-item"><span className="dot-completed"></span> Done</span>
                  <span className="legend-item"><span className="dot-started"></span> Doing</span>
                  <span className="legend-item"><span className="dot-pending"></span> To Do</span>
                </div>
              </div>


              
            </div>
          </section>
        );
      })}



      {/* ==============================
          SECCIÓN DE IA
      ============================== */}
      <div
        className="ai-section"
        style={{
          marginTop: "40px",
          padding: "20px",
          borderTop: "2px solid #eee"
        }}
      >

        {/* TÍTULO */}
        <h3
          style={{
            marginBottom: "15px",
            color: "#ffffff"
          }}
        >
          Team Insights
        </h3>


        {/* BOTÓN PARA PEDIR FEEDBACK */}
        <button

          className="btn-ai-magic"

          onClick={handleAskAI}

          disabled={isAiLoading}

        >

          {/* Texto dinámico */}
          {isAiLoading

            ? "📊 Analizando productividad..."

            : "✨ Pedir feedback al Agile Coach (AI)"}

        </button>



        {/* RESPUESTA DE IA */}
        {aiSuggestion && (

          <div className="ai-response-card">

            <h3>
              🤖 Agile Coach AI:
            </h3>

            <p className="ai-text">
              {aiSuggestion}
            </p>

          </div>
        )}
      </div>
    </div>
  );
}


// EXPORTAMOS COMPONENTE
export default TotalCompletedTasks;