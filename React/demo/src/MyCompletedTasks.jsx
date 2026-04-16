import { useState, useEffect } from "react";
import { getTasks } from "./taskService";
import "./MyCompletedTasks.css";

function MyComTasks({ tasks }) {
  
  // Mantenemos el estado de progreso por si decides reactivar la animación después
  const [progress, setProgress] = useState({ completed: 0, started: 0 });

  const total = tasks.length;

  
  // 1. Tareas marcadas como completadas (Tienen prioridad máxima)
  const completed = tasks.filter(t => t.completed).length;

  // 2. Tareas iniciadas PERO que aún no están completadas 
  // (Si t.completed es true, esta condición la ignora para no duplicar en la gráfica)
  const started = tasks.filter(t => t.started && !t.completed).length;

  // 3. Tareas que no están ni iniciadas ni completadas
  const pending = total - completed - started;

  // Cálculo de porcentajes para pasar al CSS
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const startedPercent = total > 0 ? (started / total) * 100 : 0;

  // useEffect para animación (opcional, ahora usamos los valores directos para asegurar precisión)
  useEffect(() => {
    if (total === 0) return;
    setProgress({ completed: completedPercent, started: startedPercent });
  }, [completedPercent, startedPercent, total]);

  if (total === 0) return <p>No hay datos aún</p>;

  return (
    <section id="cont">
      <h2>Tasks Overview</h2>

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
    </section>
  );
}

export default MyComTasks;