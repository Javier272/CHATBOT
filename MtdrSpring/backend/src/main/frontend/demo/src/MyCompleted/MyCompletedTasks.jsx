import { useState, useEffect } from "react";
import "./MyCompletedTasks.css";

function MyComTasks({ tasks }) {
  
  // Mantenemos el estado de progreso por si decides reactivar la animación después
  const [progress, setProgress] = useState({ completed: 0, started: 0 });

  const total = tasks.length;

  // 1. Tareas completadas (backend)
  const completed = tasks.filter(t => t.status === "completed").length;

  // 2. Tareas iniciadas
  const started = tasks.filter(t => t.status === "in_progress").length;

  // 3. Tareas pendientes
  const pending = tasks.filter(t => t.status === "pending").length;

  // HORAS (nuevo)
  const totalEstimated = tasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
  const totalActual = tasks.reduce((sum, t) => sum + (Number(t.actualHours) || 0), 0);

  // % completado global
  const completionPercent = total > 0 
    ? Math.round((completed / total) * 100) 
    : 0;

  // Cálculo de porcentajes para el pastel
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const startedPercent = total > 0 ? (started / total) * 100 : 0;

  // useEffect para animación
  useEffect(() => {
    if (total === 0) return;
    setProgress({ completed: completedPercent, started: startedPercent });
  }, [completedPercent, startedPercent, total]);

  if (total === 0) return <p>No hay datos aún</p>;

  return (
    <section id="cont">
      <h2>Tasks Overview</h2>

      {/*grafica pastel*/}
      <div 
        className="pie-chart" 
        style={{ 
          "--comp-p": `${completedPercent}%`,
          "--start-p": `${completedPercent + startedPercent}%` 
        }}
      ></div>

      <div className="legend">
        <p><span className="dot-completed"></span> Completed: {completed}</p>
        <p><span className="dot-started"></span> Started: {started}</p>
        <p><span className="dot-pending"></span> Pending: {pending}</p>
      </div>

      {/* HORAS */}
      <div className="hours-summary">
        <h3>Hours Summary</h3>
        <p>Estimated: {totalEstimated}h</p>
        <p>Actual: {totalActual}h</p>
      </div>

      {/* PROGRESO */}
      <div className="progress-section">
        <p>Completion: {completionPercent}%</p>

        <div className="progress-bar-container">
          <div className="progress-bar-background">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${completionPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

    </section>
  );
}

export default MyComTasks;