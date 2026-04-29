import { useState, useEffect } from "react";
import "./MyCompletedTasks.css";

function MyComTasks({ tasks = [] }) {
  
  // Mantenemos el estado de progreso por si decides reactivar la animación después
  const [progress, setProgress] = useState({ completed: 0, started: 0 });

  // SIEMPRE aseguramos array válido
  const safeTasks = tasks ?? [];

  const total = safeTasks.length;

  // 1. Tareas completadas (backend)
  const completed = safeTasks.filter(t => t.status === "completed").length;

  // 2. Tareas iniciadas
  const started = safeTasks.filter(t => t.status === "in_progress").length;

  // 3. Tareas pendientes
  const pending = safeTasks.filter(t => t.status === "pending").length;

  // HORAS (nuevo)
  const totalEstimated = safeTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
  const totalActual = safeTasks.reduce((sum, t) => sum + (Number(t.actualHours) || 0), 0);

  // % completado global
  const completionPercent = total > 0 
    ? Math.round((completed / total) * 100) 
    : 0;

  // Cálculo de porcentajes para el pastel
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const startedPercent = total > 0 ? (started / total) * 100 : 0;

  // useEffect para animación
  useEffect(() => {
    setProgress({ completed: completedPercent, started: startedPercent });
  }, [completedPercent, startedPercent]);

  return (
    <section id="cont">
      <h2>Tasks Overview</h2>

      {/* SIEMPRE se renderiza el gráfico (aunque sea 0) */}
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