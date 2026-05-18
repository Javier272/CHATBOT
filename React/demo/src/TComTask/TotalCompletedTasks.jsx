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
        Tasks Dashboard Divided by Sprint
      </h2>

      {/* RECORRE TODOS LOS SPRINTS */}
      {sprintEntries.map(([sprintName, sprintTasks]) => {
        // ==============================
        // LÓGICA Y CÁLCULOS DEL SPRINT
        // ==============================
        const userStats = (users || [])
          // Excluir al usuario "prueba"
          .filter(u => {
            const userName = String(u.NAME || u.name || "").trim().toLowerCase();
            return userName !== "prueba";
          })
          .reduce((stats, u) => {
            const clean = (val) => String(val || "").replace(/['"]+/g, '').trim().toLowerCase();

            const currentUserId = u.USER_ID || u.user_id || u.id;
            const currentUserName = clean(u.NAME || u.name);

            // Filtramos tareas por usuario
            const userTasks = (sprintTasks || []).filter(t => {
              const taskOwner = clean(t.userName || t.USERNAME);
              return taskOwner !== "" && taskOwner === currentUserName;
            });

            // Contamos estados y horas
            stats[currentUserId] = {
              completed: userTasks.filter(t => clean(t.STATUS || t.status) === "completed").length,
              started: userTasks.filter(t => {
                const s = clean(t.STATUS || t.status);
                return s === "in_progress" || s === "started";
              }).length,
              pending: userTasks.filter(t => clean(t.STATUS || t.status) === "pending").length,
              total: userTasks.length,

              estimatedHours: userTasks.reduce((a, t) => a + (Number(t.hoursEstimate) || 0), 0),
              actualHours: userTasks.reduce((a, t) => a + (Number(t.realHours) || 0), 0)
            };

            return stats;
          }, {});

        // Totales globales del sprint
        let totalCompleted = 0;
        let totalStarted = 0;
        let totalPending = 0;

        Object.values(userStats).forEach(stat => {
          totalCompleted += stat.completed;
          totalStarted += stat.started;
          totalPending += stat.pending;
        });

        // Cálculo total (Corregido: Declarado una sola vez)
        const totalSprintTasks = totalCompleted + totalStarted + totalPending;

        // Porcentajes para el Dashboard inferior
        const percentCompleted = totalSprintTasks > 0 ? Math.round((totalCompleted / totalSprintTasks) * 100) : 0;
        const percentStarted = totalSprintTasks > 0 ? Math.round((totalStarted / totalSprintTasks) * 100) : 0;
        const percentPending = totalSprintTasks > 0 ? Math.round((totalPending / totalSprintTasks) * 100) : 0;

        // Cálculo de máximos para la altura de las gráficas
        const maxTasks = Math.max(...Object.values(userStats).map(u => u.total), 1);
        const maxHours = Math.max(...Object.values(userStats).map(u => Math.max(u.estimatedHours, u.actualHours)), 1);

        // Función para marcas del eje Y
        const getTicks = (max) =>
          Array.from(
            { length: 5 },
            (_, i) => Math.round(max - (i * (max / 4)))
          );
// ==============================
        // RENDER DEL SPRINT
        // ==============================

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
                          
                          // Key compuesta única para este Sprint y este Usuario
                          const uniqueKey = `hours-bar-${sprintName}-${userId}`;

                          return (
                            <div key={uniqueKey} className="bar-chart-group">
                              <div className="bars-vertical-container">
                                {/* Barra Estimada */}
                                <div className="bar-track-wrapper">
                                  <div className="bar-fill estimated" style={{ height: `${(estimatedHours / divisor) * 100}%` }}></div>
                                </div>
                                {/* Barra Real */}
                                <div className="bar-track-wrapper">
                                  <div className="bar-fill actual" style={{ height: `${(actualHours / divisor) * 100}%` }}></div>
                                </div>
                              </div>
                              {/* Nombre del usuario */}
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
                <h4 className="chart-title">Tasks per user</h4>
                
                <div className="chart-with-axis">
                  {/* Eje Y */}
                  <div className="axis-y">
                    {getTicks(maxTasks).map((t, i) => (
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
                        const divisor = maxTasks || 1; 

                        const uniqueKey = `tasks-bar-${sprintName}-${userId}`;

                        return (
                          <div key={uniqueKey} className="bar-chart-group">
                            <div className="bars-vertical-container">
                              {/* Barra Completadas */}
                              <div className="bar-track-wrapper">
                                <div className="bar-fill completed" style={{ height: `${(completed / divisor) * 100}%` }}></div>
                              </div>
                              {/* Barra En Progreso */}
                              <div className="bar-track-wrapper">
                                <div className="bar-fill started" style={{ height: `${(started / divisor) * 100}%` }}></div>
                              </div>
                              {/* Barra Pendientes */}
                              <div className="bar-track-wrapper">
                                <div className="bar-fill pending" style={{ height: `${(pending / divisor) * 100}%` }}></div>
                              </div>
                            </div>
                            <span className="chart-user-name">{getUserName(userId)}</span>
                          </div>
                          
                        );
                      })}

                      
                    </div>
                    
                  </div>
                  
                </div>
                <h2></h2>

                        <div className="legend-label-row">
                          <span className="indicator-dot dot-done"></span>
                          <span className="label-text">Done</span>
                        </div>
                <div className="legend-label-row">
                          <span className="indicator-dot dot-doing"></span>
                          <span className="label-text">Doing</span>
                </div>
                <div className="legend-label-row">
                  <span className="indicator-dot dot-todo"></span>
                  <span className="label-text">To Do</span>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* COMPONENTE DE PROGRESO DE SPRINT ESTILO PREFABS */}
              {/* ========================================================================= */}
              <div className="sprint-progress-dashboard-card">
                <h3 className="dashboard-card-title">Sprint Progress</h3>
                
                <div className="dashboard-card-body">
                  
                  {/* LADO IZQUIERDO: Anillo Circular de Porcentaje */}
                  <div className="progress-circle-wrapper">
                    <svg className="progress-svg" viewBox="0 0 100 100">
                      <circle className="circle-bg" cx="50" cy="50" r="40" />
                      <circle 
                        className="circle-stroke-fill" 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        style={{
                          strokeDasharray: `${2 * Math.PI * 40}`,
                          strokeDashoffset: `${2 * Math.PI * 40 * (1 - percentCompleted / 100)}`
                        }}
                      />
                    </svg>
                    <div className="circle-inner-text">
                      <span className="circle-number">{percentCompleted}%</span>
                    </div>
                  </div>

                  {/* LADO DERECHO: Barra total y Estadísticas detalladas */}
                  <div className="progress-details-wrapper">
                    <h4 className="total-tasks-count">Total: {totalSprintTasks} tasks</h4>
                    
                    {/* Barra apilada redondeada */}
                    <div className="dashboard-stacked-bar">
                      {totalSprintTasks > 0 ? (
                        <>
                          <div className="fill-done" style={{ width: `${percentCompleted}%` }}></div>
                          <div className="fill-doing" style={{ width: `${percentStarted}%` }}></div>
                          <div className="fill-todo" style={{ width: `${percentPending}%` }}></div>
                        </>
                      ) : (
                        <div style={{ width: '100%', background: '#1e293b' }}></div>
                      )}
                    </div>

                    {/* Leyenda vertical estilizada en columnas */}
                    <div className="dashboard-legend-grid">
                      <div className="legend-column-item">
                        <div className="legend-label-row">
                          <span className="indicator-dot dot-done"></span>
                          <span className="label-text">Done</span>
                        </div>
                        <span className="legend-metrics">{totalCompleted} ({percentCompleted}%)</span>
                      </div>

                      <div className="legend-column-item">
                        <div className="legend-label-row">
                          <span className="indicator-dot dot-doing"></span>
                          <span className="label-text">Doing</span>
                        </div>
                        <span className="legend-metrics">{totalStarted} ({percentStarted}%)</span>
                      </div>

                      <div className="legend-column-item">
                        <div className="legend-label-row">
                          <span className="indicator-dot dot-todo"></span>
                          <span className="label-text">To Do</span>
                        </div>
                        <span className="legend-metrics">{totalPending} ({percentPending}%)</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              {/* ========================================================================= */}

            </div>
          </section>
        );
      })}

      {/* ========================================================= */}
      {/* Seccionn IA*/}
      {/* ========================================================= */}
      <div className="ai-section">
      {/* TÍTULO PRINCIPAL */}
      <h3 className="ai-section-title">Team Insights</h3>

      {/* BOTÓN PARA PEDIR FEEDBACK */}
      <button
        className={`btn-ai-magic ${isAiLoading ? "loading" : ""}`}
        onClick={handleAskAI}
        disabled={isAiLoading}
      >
        {isAiLoading ? (
          <>
            <span className="ai-spinner"></span>
            📊 Analizing productivity...
          </>
        ) : (
          "✨ Ask for feedback to Agile Coach (AI)"
        )}
      </button>

      {/* RESPUESTA DE IA */}
      {aiSuggestion && (
        <div className="ai-response-card">
          <h3 className="ai-card-title">
            <span className="ai-icon-pulse">🤖</span> Agile Coach AI:
          </h3>
          <p className="ai-text">{aiSuggestion}</p>
        </div>
      )}
    </div>
    </div>
  );
}


// EXPORTAMOS COMPONENTE
export default TotalCompletedTasks;