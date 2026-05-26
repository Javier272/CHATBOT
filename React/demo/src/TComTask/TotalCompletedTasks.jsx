// useState para manejar estados dinámicos
// useMemo para memorizar cálculos y evitar recalcular innecesariamente
import { useMemo, useState } from "react";
import { getAiStats } from "../taskService"; // FUNCIÓN QUE HACE LA PETICIÓN A LA IA
import "./TotalCompletedTasks.css";

import balance from "../assets/balance.png"
import presicion from "../assets/presicion.png"

 
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
          Charging data... / No tasks available
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
              realHours: userTasks.reduce(
                (a, t) =>
                  a + Number(
                    t.REAL_HOURS ??
                    t.real_hours ??
                    t.realHours ??
                    0
                  ),
                0
              )
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
        const maxHours = Math.max(...Object.values(userStats).map(u => Math.max(u.estimatedHours, u.realHours)),1);

        // Función para marcas del eje Y
        const getTicks = (max) =>
          Array.from(
            { length: 5 },
            (_, i) => Math.round(max - (i * (max / 4)))
          );

          // ======================================
          // HOURS ANALYSIS
          // ======================================

          // Total horas estimadas del sprint
          const totalEstimatedHours = sprintTasks.reduce(
            (acc, t) =>
              acc + Number(
                t.hoursEstimate ??
                t.HOURS_ESTIMATE ??
                0
              ),
            0
          );

          // Total horas reales del sprint
          const totalRealHours = sprintTasks.reduce(
            (acc, t) =>
              acc + Number(
                t.REAL_HOURS ??
                t.real_hours ??
                t.realHours ??
                0
              ),
            0
          );

          // Diferencia
          const hoursDifference =
            totalRealHours - totalEstimatedHours;

          // Precisión
          const estimationAccuracy =
            totalEstimatedHours > 0
              ? Math.max(
                  0,
                  (
                    100 -
                    (Math.abs(hoursDifference) /
                      totalEstimatedHours) *
                      100
                  )
                ).toFixed(1)
              : 100;

          // Estado visual
          const balanceStatus =
            hoursDifference > 0
              ? "warning"
              : "success";

          const balanceText =
            hoursDifference > 0
              ? `+${hoursDifference}h of delay`
              : `${Math.abs(hoursDifference)}h within the range`;

          const accuracyLabel =
            estimationAccuracy >= 90
              ? "Excellent"
              : estimationAccuracy >= 75
              ? "Good"
              : "Improvable";

          const accuracyStatus =
            estimationAccuracy >= 75
              ? "success"
              : "warning";



  // ==============================
  // RENDER DEL SPRINT
  // ==============================
          return (
  <section
    key={sprintName}
    className="total-sprint-group"
  >
    {/* ===================================================== */}
    {/* SPRINT TITLE */}
    {/* ===================================================== */}
    <h3 className="total-sprint-title">
      Sprint {sprintName}
    </h3>

    {/* ===================================================== */}
    {/* MAIN DASHBOARD LAYOUT */}
    {/* ===================================================== */}
    <div className="total-dashboard-layout sprint-dashboard-layout">

      {/* ===================================================== */}
      {/* HOURS CHART */}
      {/* ===================================================== */}
      <div className="total-chart-section">

        <h4 className="total-chart-title">
          Est. vs Actual Hours
        </h4>

        <div className="total-chart-with-axis">

          {/* Y AXIS */}
<div className="total-axis-y">
  {getTicks(maxHours).map((t, index) => (
    <div key={`hours-tick-${t}-${index}`} className="total-axis-tick">
      <span>{t}h</span>
    </div>
  ))}
</div>

          {/* CHART */}
          <div className="total-chart-scroll-wrapper">

            <div className="total-bar-chart-viewport">

              {Object.keys(userStats).map((userId) => {

                const {
                  estimatedHours = 0,
                  realHours = 0
                } = userStats[userId] || {};

                const divisor = maxHours || 1;

                return (
                  <div
                    key={`hours-bar-${sprintName}-${userId}`}
                    className="total-bar-chart-group"
                  >

                    <div className="total-bars-vertical-container">

                      {/* ESTIMATED */}
                      <div className="total-bar-track-wrapper">
                        <div
                          className="total-bar-fill estimated"
                          style={{
                            height: `${(estimatedHours / divisor) * 100}%`
                          }}
                        />
                      </div>

                      {/* ACTUAL */}
                      <div className="total-bar-track-wrapper">
                        <div
                          className="total-bar-fill actual"
                          style={{
                            height: `${(realHours / divisor) * 100}%`
                          }}
                        />
                      </div>

                    </div>

                    <span className="total-chart-user-name">
                      {getUserName(userId)}
                    </span>

                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* LEGEND */}
        <div className="total-chart-legend">

          <div className="total-legend-item">
            <span className="total-legend-dot total-dot-estimated"></span>
            <span>Estimated</span>
          </div>

          <div className="total-legend-item">
            <span className="total-legend-dot total-dot-actual"></span>
            <span>Real</span>
          </div>

        </div>
      </div>

      {/* ===================================================== */}
      {/* TASKS CHART */}
      {/* ===================================================== */}
      <div className="total-chart-section">

        <h4 className="total-chart-title">
          Tasks per user
        </h4>

        <div className="total-chart-with-axis">

          {/* Y AXIS */}
          <div className="total-axis-y">
            {getTicks(maxTasks).map((t, i) => (
              <div
                key={`tick-task-${t}-${i}`}
                className="total-axis-tick"
              >
                <span>{t}</span>
                <div className="total-grid-line"></div>
              </div>
            ))}
          </div>

          {/* CHART */}
          <div className="total-chart-scroll-wrapper">

            <div className="total-bar-chart-viewport">

              {Object.keys(userStats).map((userId) => {

                const {
                  completed,
                  started,
                  pending
                } = userStats[userId];

                const divisor = maxTasks || 1;

                return (
                  <div
                    key={`tasks-bar-${sprintName}-${userId}`}
                    className="total-bar-chart-group"
                  >

                    <div className="total-bars-vertical-container">

                      {/* DONE */}
                      <div className="total-bar-track-wrapper">
                        <div
                          className="total-bar-fill completed"
                          style={{
                            height: `${(completed / divisor) * 100}%`
                          }}
                        />
                      </div>

                      {/* DOING */}
                      <div className="total-bar-track-wrapper">
                        <div
                          className="total-bar-fill started"
                          style={{
                            height: `${(started / divisor) * 100}%`
                          }}
                        />
                      </div>

                      {/* TODO */}
                      <div className="total-bar-track-wrapper">
                        <div
                          className="total-bar-fill pending"
                          style={{
                            height: `${(pending / divisor) * 100}%`
                          }}
                        />
                      </div>

                    </div>

                    <span className="total-chart-user-name">
                      {getUserName(userId)}
                    </span>

                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* LEGEND */}
        <div className="total-chart-legend">

          <div className="total-legend-item">
            <span className="total-legend-dot total-dot-done"></span>
            <span>Completed</span>
          </div>

          <div className="total-legend-item">
            <span className="total-legend-dot total-dot-doing"></span>
            <span>In progress</span>
          </div>

          <div className="total-legend-item">
            <span className="total-legend-dot total-dot-todo"></span>
            <span>Pending</span>
          </div>

        </div>
      </div>

      {/* ===================================================== */}
      {/* SPRINT PROGRESS CARD */}
      {/* ===================================================== */}
      <div className="total-progress-card">

        <h3 className="total-progress-card-title">
          Sprint Progress
        </h3>

        <div className="total-progress-card-body">

          {/* ================================================= */}
          {/* PROGRESS CIRCLE */}
          {/* ================================================= */}
          <div className="total-progress-circle-wrapper">

            <svg
              className="total-progress-svg"
              viewBox="0 0 100 100"
            >
              <circle
                className="total-circle-bg"
                cx="50"
                cy="50"
                r="40"
              />

              <circle
                className="total-circle-fill"
                cx="50"
                cy="50"
                r="40"
                style={{
                  strokeDasharray: `${2 * Math.PI * 40}`,
                  strokeDashoffset:
                    `${2 * Math.PI * 40 * (1 - percentCompleted / 100)}`
                }}
              />
            </svg>

            <div className="total-circle-inner">
              <span className="total-circle-number">
                {percentCompleted}%
              </span>
            </div>
          </div>

         
          {/* ================================================= */}
          {/* DETAILS */}
          {/* ================================================= */}
          <div className="total-progress-details">

            <h4 className="total-tasks-count">
              Total: {totalSprintTasks} tasks
            </h4>

            {/* STACKED BAR */}
            <div className="total-dashboard-stacked-bar">

              {totalSprintTasks > 0 ? (
                <>
                  <div
                    className="total-fill-done"
                    style={{
                      width: `${percentCompleted}%`
                    }}
                  />

                  <div
                    className="total-fill-doing"
                    style={{
                      width: `${percentStarted}%`
                    }}
                  />

                  <div
                    className="total-fill-todo"
                    style={{
                      width: `${percentPending}%`
                    }}
                  />
                </>
              ) : (
                <div
                  style={{
                    width: "100%",
                    background: "#1e293b"
                  }}
                />
              )}

            </div>

            {/* LEGEND */}
            <div className="total-dashboard-legend-grid">

              <div className="total-legend-column-item">
                <div className="total-legend-label-row">
                  <span className="total-legend-dot total-dot-done"></span>
                  <span className="total-label-text">Completed</span>
                </div>

                <span className="total-legend-metrics">
                  {totalCompleted} ({percentCompleted}%)
                </span>
              </div>

              <div className="total-legend-column-item">
                <div className="total-legend-label-row">
                  <span className="total-legend-dot total-dot-doing"></span>
                  <span className="total-label-text">In progress</span>
                </div>

                <span className="total-legend-metrics">
                  {totalStarted} ({percentStarted}%)
                </span>
              </div>

              <div className="total-legend-column-item">
                <div className="total-legend-label-row">
                  <span className="total-legend-dot total-dot-todo"></span>
                  <span className="total-label-text">Pending</span>
                </div>

                <span className="total-legend-metrics">
                  {totalPending} ({percentPending}%)
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
         {/* ================================================= */}
          {/* HORAS ANALISIS */}
          {/* ================================================= */}
      
      <div className="hours-analysis-container">
          {/* BALANCE GLOBAL */}
            <div className="analysis-card">
              <img src={presicion} alt="presicion" className="img-sideButton-hours " />

              <div className="card-info">
                <label>Global Balance</label>
                <div className="hours-compare">
                  <span className="actual-total">
                     {totalRealHours}h <small>Real</small>
                  </span>

                  <span className="divider">/</span>

                  <span className="estimated-total">
                    {totalEstimatedHours}h <small>Estimated</small>
                  </span>
                </div>
              </div>

              <div className={`status-badge ${balanceStatus}`}>
                {balanceText}
              </div>

            </div>

          {/* PRECISIÓN */}
            <div className="analysis-card">
              <img src={balance} alt="balance" className="img-sideButton-hours " />
              <div className="card-info">
                <label>Estimation Accuracy</label>
                <h3>{estimationAccuracy}%</h3>
              </div>
              <div className={`status-badge ${accuracyStatus}`}>
                 {accuracyLabel}
              </div>
            </div>
          </div>
      </div>
      
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
  </section>
);
      })}

    </div>
  );
}


// EXPORTAMOS COMPONENTE
export default TotalCompletedTasks;
