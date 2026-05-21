import { useMemo } from "react";

function SprintUsersOverview({ tasks = [], users = [] }) {

  // =========================================
  // AGRUPAR POR SPRINT Y USUARIO
  // =========================================
  const sprintData = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    const grouped = {};

    tasks.forEach(task => {
      const sprint = task?.sprint || "Sin Sprint";
      if (!grouped[sprint]) {
        grouped[sprint] = {};
      }

      const username = String(
        task.userName ||
        task.USERNAME ||
        "Unassigned"
      ).trim();

      if (!grouped[sprint][username]) {
        grouped[sprint][username] = {
          completed: 0,
          realHours: 0
        };
      }

      const status = String(
        task.STATUS || task.status || ""
      ).toLowerCase();

      if (status === "completed") {
        grouped[sprint][username].completed += 1;
      }

      grouped[sprint][username].realHours += Number(
        task.REAL_HOURS ||
        task.real_hours ||
        task.realHours ||
        0
      );
    });

    return grouped;
  }, [tasks]);

  // =========================================
  // MAXIMOS
  // =========================================
  const maxCompleted = Math.max(
    ...Object.values(sprintData).flatMap(users =>
      Object.values(users).map(u => u.completed)
    ),
    1
  );

  const maxHours = Math.max(
    ...Object.values(sprintData).flatMap(users =>
      Object.values(users).map(u => u.realHours)
    ),
    1
  );

  const getTicks = (max) =>
    Array.from(
      { length: 5 },
      (_, i) => Math.round(max - (i * (max / 4)))
    );

// Reemplaza tus arrays de colores anteriores por estos:

const colors = [
  { bottom: "#192d64", mid: "#3b82f6", top: "#93c5fd", glow: "rgba(59, 130, 246, 0.5)" }, // Azul neón
  { bottom: "#064e3b", mid: "#10b981", top: "#6ee7b7", glow: "rgba(16, 185, 129, 0.5)" }, // Verde neón
  { bottom: "#7c2d12", mid: "#f97316", top: "#fdba74", glow: "rgba(249, 115, 22, 0.5)" },  // Naranja neón
  { bottom: "#7f1d1d", mid: "#ef4444", top: "#fca5a5", glow: "rgba(239, 68, 68, 0.5)" },  // Rojo neón
  { bottom: "#4c1d95", mid: "#a855f7", top: "#d8b4fe", glow: "rgba(168, 85, 247, 0.5)" }, // Morado neón
  { bottom: "#134e4a", mid: "#14b8a6", top: "#99f6e4", glow: "rgba(20, 184, 166, 0.5)" }, // Turquesa neón
  { bottom: "#713f12", mid: "#eab308", top: "#fef08a", glow: "rgba(234, 179, 8, 0.5)" }   // Amarillo neón
];

const hoursColors = [
  { bottom: "#164e63", mid: "#06b6d4", top: "#67e8f9", glow: "rgba(6, 182, 212, 0.5)" },  // Cyan neón
  { bottom: "#9d174d", mid: "#ec4899", top: "#fbcfe8", glow: "rgba(236, 72, 153, 0.5)" },  // Rosa neón
  { bottom: "#3f6212", mid: "#84cc16", top: "#bef264", glow: "rgba(132, 204, 22, 0.5)" },  // Lima neón
  { bottom: "#78350f", mid: "#f59e0b", top: "#fde68a", glow: "rgba(245, 158, 11, 0.5)" },  // Ámbar neón
  { bottom: "#312e81", mid: "#6366f1", top: "#c7d2fe", glow: "rgba(99, 102, 241, 0.5)" },  // Índigo neón
  { bottom: "#065f46", mid: "#10b981", top: "#a7f3d0", glow: "rgba(16, 185, 129, 0.5)" },  // Esmeralda neón
  { bottom: "#9f1239", mid: "#f43f5e", top: "#fecdd3", glow: "rgba(244, 63, 94, 0.5)" }   // Rosado fuerte neón
];
const currentColor = colors[idx % colors.length];
const currentHourColor = hoursColors[idx % hoursColors.length];

<div
  className="total-bar-fill multi-sprint-glow-bar"
  style={{
    height: `${(stats.realHours / maxHours) * 100}%`,
    background: `linear-gradient(to top, ${currentHourColor.bottom} 0%, ${currentHourColor.mid} 50%, ${currentHourColor.top} 100%)`,
    '--bar-glow-color': currentHourColor.glow
  }}
/>
  return (
    <section className="total-sprint-group">
      <h2 className="pending-title-main">
        Sprint Team Overview
      </h2>

      <div className="total-dashboard-layout">

{/* ================================================= */}
{/* TASKS COMPLETED */}
{/* ================================================= */}
<div className="total-chart-section">
  <h4 className="total-chart-title">
    Tasks Completed by Developer per Sprint
  </h4>

  <div className="total-chart-with-axis">
    {/* Y AXIS */}
    <div className="total-axis-y">
      {getTicks(maxCompleted).map((t, i) => (
        <div key={i} className="total-axis-tick">
          <span>{t}</span>
        </div>
      ))}
    </div>

    {/* CHART */}
    <div className="total-chart-scroll-wrapper">
      <div className="total-bar-chart-viewport multi-sprint-viewport">
        
        {Object.entries(sprintData).map(([sprintName, sprintUsers]) => (
          <div key={sprintName} className="total-bar-chart-group sprint-group-container">
            
            {/* BARRAS INTERNAS DEL SPRINT */}
            <div className="sprint-bars-container">
              {Object.entries(sprintUsers).map(([username, stats], idx) => {
                // Selecciona el color de 3 niveles correspondiente al índice actual
                const currentColor = colors[idx % colors.length];
                
                return (
                  <div key={idx} className="sprint-user-column">
                    {/* BARRA */}
                    <div className="total-bar-track-wrapper">
                      <div
                        className="total-bar-fill multi-sprint-glow-bar"
                        style={{
                          height: `${(stats.completed / maxCompleted) * 100}%`,
                          background: `linear-gradient(to top, ${currentColor.bottom} 0%, ${currentColor.mid} 50%, ${currentColor.top} 100%)`,
                          '--bar-glow-color': currentColor.glow
                        }}
                      />
                    </div>
                    {/* NOMBRE DEVELOPER */}
                    <span className="sprint-username">
                      {username}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ETIQUETA SPRINT */}
            <span className="sprint-group-label">
              Sprint {sprintName}
            </span>
          </div>
        ))}

      </div>
    </div>
  </div>
</div>

{/* ================================================= */}
{/* HORAS */}
{/* ================================================= */}
<div className="total-chart-section">
  <h4 className="total-chart-title">
    Total Real Hours per User / Sprint
  </h4>

  <div className="total-chart-with-axis">
    {/* Y AXIS */}
    <div className="total-axis-y">
      {getTicks(maxHours).map((t, i) => (
        <div key={i} className="total-axis-tick">
          <span>{t}h</span>
        </div>
      ))}
    </div>

    {/* CHART */}
    <div className="total-chart-scroll-wrapper">
      <div className="total-bar-chart-viewport multi-sprint-viewport">

        {Object.entries(sprintData).map(([sprintName, sprintUsers]) => (
          <div key={sprintName} className="total-bar-chart-group sprint-group-container">
            
            {/* BARRAS INTERNAS DEL SPRINT */}
            <div className="sprint-bars-container">
              {Object.entries(sprintUsers).map(([username, stats], idx) => {
                // Selecciona el color de 3 niveles correspondiente al índice actual
                const currentHourColor = hoursColors[idx % hoursColors.length];
                
                return (
                  <div key={idx} className="sprint-user-column">
                    {/* BARRA */}
                    <div className="total-bar-track-wrapper">
                      <div
                        className="total-bar-fill multi-sprint-glow-bar"
                        style={{
                          height: `${(stats.realHours / maxHours) * 100}%`,
                          background: `linear-gradient(to top, ${currentHourColor.bottom} 0%, ${currentHourColor.mid} 50%, ${currentHourColor.top} 100%)`,
                          '--bar-glow-color': currentHourColor.glow
                        }}
                      />
                    </div>
                    {/* NOMBRE DEVELOPER */}
                    <span className="sprint-username">
                      {username}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ETIQUETA SPRINT */}
            <span className="sprint-group-label">
              Sprint {sprintName}
            </span>
          </div>
        ))}

      </div>
    </div>
  </div>
</div>

      </div>
    </section>
  );
}

export default SprintUsersOverview;