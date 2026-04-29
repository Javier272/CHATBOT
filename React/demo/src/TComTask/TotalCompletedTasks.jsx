import { useMemo } from "react";
import "./TotalCompletedTasks.css";

function TotalCompletedTasks({ tasks = [], users = [] }) {
  const tasksBySprint = useMemo(() => {
    if (!Array.isArray(tasks)) return {};
    return tasks.reduce((acc, task) => {
      const sprint = task?.sprint || "Sin Sprint";
      if (!acc[sprint]) acc[sprint] = [];
      acc[sprint].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const getUserName = (id) => {
    if (!users || !Array.isArray(users)) return "Unknown";
    const user = users.find(u => String(u.id) === String(id));
    return user ? user.name : "Unassigned";
  };

  const sprintEntries = Object.entries(tasksBySprint);

  if (sprintEntries.length === 0) {
    return <div className="pending-wrapper"><p>Cargando datos o sin tareas disponibles...</p></div>;
  }

  return (
    <div className="pending-wrapper">
      <h2 className="pending-title-main">Tasks Dashboard by Sprint</h2>

      {sprintEntries.map(([sprintName, sprintTasks]) => {
        const userStats = (users || []).reduce((stats, u) => {
          const userTasks = sprintTasks.filter(t => 
             (t.userId && String(t.userId) === String(u.id)) || 
             (t.userName && String(t.userName).trim().toLowerCase() === String(u.name).trim().toLowerCase())
          );
          stats[u.id] = {
            completed: userTasks.filter(t => t.status === "completed").length,
            started: userTasks.filter(t => t.status === "in_progress" || t.status === "doing").length,
            pending: userTasks.filter(t => t.status === "pending").length,
            total: userTasks.length,
            estimatedHours: userTasks.reduce((a, t) => a + (Number(t.hoursEstimate) || 0), 0),
            actualHours: userTasks.reduce((a, t) => a + (Number(t.realHours) || 0), 0)
          };
          return stats;
        }, {});

        // Cálculos para Ejes (Dinámicos por Sprint)
        const maxTasks = Math.max(...Object.values(userStats).map(u => u.total), 5);
        const maxHours = Math.max(...Object.values(userStats).map(u => Math.max(u.estimatedHours, u.actualHours)), 5);
        
        const getTicks = (max) => Array.from({length: 5}, (_, i) => Math.round(max - (i * (max / 4))));

        return (
          <section key={sprintName} className="sprint-group">
            <h3 className="sprint-title">{sprintName === "Sin Sprint" ? sprintName : `Sprint ${sprintName}`}</h3>

           {/* sprint-dashboard-layout */}
<div className="sprint-dashboard-layout">

  {/* 1. PANEL DE HORAS (Ahora a la IZQUIERDA con estructura Barchar) */}
  {/* 1. PANEL DE HORAS (IZQUIERDA) - AHORA CON SCROLL */}
<div className="bar-chart-section">
  <h4 className="chart-title">Est. vs Actual Hours</h4>
  <div className="chart-with-axis">
    <div className="axis-y">
      {getTicks(maxHours).map(t => (
        <div key={t} className="axis-tick">
          <span>{t}h</span>
          <div className="grid-line"></div>
        </div>
      ))}
    </div>
    
    {/* HE AÑADIDO ESTE CONTENEDOR (chart-scroll-wrapper) */}
    <div className="chart-scroll-wrapper">
      <div className="bar-chart-viewport">
        {Object.keys(userStats).map((userId) => {
          const { estimatedHours, actualHours } = userStats[userId];
          const divisor = maxHours || 1;
          return (
            <div key={userId} className="bar-chart-group">
              <div className="bars-vertical-container">
                <div className="bar-track-wrapper">
                  <div className="bar-fill estimated" style={{ height: `${(estimatedHours / divisor) * 100}%` }}></div>
                </div>
                <div className="bar-track-wrapper">
                  <div className="bar-fill actual" style={{ height: `${(actualHours / divisor) * 100}%` }}></div>
                </div>
              </div>
              <span className="chart-user-name">{getUserName(userId)}</span>
            </div>
          );
        })}
      </div>
    </div>
    {/* FIN DEL WRAPPER */}
    
  </div>
  <div className="chart-legend-details">
    <span className="legend-item"><span className="dot-estimated"></span> Est.</span>
    <span className="legend-item"><span className="dot-actual"></span> Actual</span>
  </div>
</div>

  {/* 2. PANEL DE TAREAS (Ahora a la DERECHA con estructura Barchar) */}
  <div className="bar-chart-section">
    <h4 className="chart-title">Tasks per user (Max: {maxTasks})</h4>
    <div className="chart-with-axis">
      <div className="axis-y">
        {getTicks(maxTasks).map(t => (
          <div key={t} className="axis-tick">
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
            return (
              <div key={userId} className="bar-chart-group">
                <div className="bars-vertical-container">
                  <div className="bar-track-wrapper">
                    <div className="bar-fill completed" style={{ height: `${(completed / divisor) * 100}%` }}></div>
                  </div>
                  <div className="bar-track-wrapper">
                    <div className="bar-fill started" style={{ height: `${(started / divisor) * 100}%` }}></div>
                  </div>
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
    </div>
  );
}

export default TotalCompletedTasks;