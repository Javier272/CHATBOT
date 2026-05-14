import { useState, useEffect } from "react";
import "./MyCompletedTasks.css";

function MyComTasks({ tasks = [] }) {
  // 🟢 LOG 1: ¿Qué le está llegando a Diego?
  console.log("📥 Tareas recibidas en MyComTasks:", tasks);

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  
  // Función CRUCIAL para limpiar las comillas de la base de datos
  const clean = (val) => String(val || "").replace(/['"]+/g, '').trim().toLowerCase();

  // 🟢 LOG 2: Ver cómo se están leyendo las horas y estados de cada tarea
  safeTasks.forEach(t => {
    console.log(`🔎 Tarea: "${t.title}" | Status original: ${t.status} -> Limpio: ${clean(t.status)} | Horas (Est/Real): ${t.hoursEstimate}/${t.realHours}`);
  });

  const maxHoursRaw = Math.max(...safeTasks.map(t => Math.max(Number(t.hoursEstimate) || 0, Number(t.realHours) || 0)), 0);
  const maxAxis = maxHoursRaw > 0 ? Math.ceil(maxHoursRaw) : 1;

  const numTicks = 5; 
  const step = Math.ceil(maxAxis / (numTicks - 1)) || 1;
  const ticks = [];
  for (let i = 0; i <= maxAxis; i += step) {
    ticks.push(i);
  }
  ticks.reverse();

  // 2. Filtros para la dona y leyendas (AHORA USANDO LA FUNCIÓN CLEAN)
  const total = safeTasks.length;
  const completed = safeTasks.filter(t => clean(t.status || t.STATUS) === "completed").length;
  
  const started = safeTasks.filter(t => {
    const s = clean(t.status || t.STATUS);
    return s === "in_progress" || s === "doing" || s === "started";
  }).length;
  
  const pending = safeTasks.filter(t => clean(t.status || t.STATUS) === "pending").length;

  const totalPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 🟢 LOG 3: Ver los totales finales que se van a dibujar
  console.log("📊 Resumen para las gráficas:", { total, completed, started, pending, maxAxis, totalPercent });

  // Si no hay tareas, evitamos renderizar gráficas vacías y avisamos en pantalla
  if (total === 0) {
    return (
      <section className="dashboard-container">
        <h2 className="dashboard-title-main">Tasks Overview</h2>
        <p style={{ textAlign: "center", padding: "20px" }}>No tasks assigned or found.</p>
      </section>
    );
  }

  return (
    <section className="dashboard-container">
      <h2 className="dashboard-title-main">Tasks Overview</h2>

      <div className="sprint-card-block">
        <div className="sprint-charts-layout">
          
          {/* GRÁFICA DE DONA */}
          <div className="bar-chart-section">
            <h3 className="chart-title">Status Distribution</h3>
            <div className="pie-chart-viewport">
              <div className="pie-chart-group">
                <div 
                  className="pie-chart" 
                  style={{ 
                    "--completed": `${total > 0 ? (completed / total) * 100 : 0}%`,
                    "--started": `${total > 0 ? (started / total) * 100 : 0}%` 
                  }}
                >
                  <div className="pie-chart-center"></div>
                </div>
                <div className="chart-legend-details">
                  <span className="legend-item"><span className="dot-completed"></span> {completed} Done</span>
                  <span className="legend-item"><span className="dot-started"></span> {started} Doing</span>
                  <span className="legend-item"><span className="dot-pending"></span> {pending} To Do</span>
                </div>
              </div>
            </div>
          </div>

          {/* GRÁFICA DE BARRAS (COMPARATIVA DE HORAS) */}
          <div className="bar-chart-section">
            <h3 className="chart-title">Hours per Task (Comparison)</h3>
            <div className="chart-with-axis">
              <div className="axis-y">
                {ticks.map(tick => (
                  <div key={tick} className="axis-tick">
                    <span>{tick}h</span>
                    <div className="grid-line"></div>
                  </div>
                ))}
              </div>

              <div className="bar-chart-viewport">
                {safeTasks.map((task, idx) => (
                  <div key={task.id || idx} className="bar-chart-group">
                    <div className="bars-vertical-container">
                      {/* Barra Estimada */}
                      <div className="bar-track-wrapper">
                        <div 
                          className="bar-fill estimated" 
                          style={{ height: `${(Number(task.hoursEstimate || 0) / maxAxis) * 100}%` }}
                        ></div>
                      </div>
                      {/* Barra Real */}
                      <div className="bar-track-wrapper">
                        <div 
                          className="bar-fill actual" 
                          style={{ height: `${(Number(task.realHours || 0) / maxAxis) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    {/* Fallback a título genérico si no hay title */}
                    <span className="chart-user-name">{task.title || `Task ${idx + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-legend-details" style={{ flexDirection: 'row', gap: '20px', marginTop: '15px', justifyContent: 'center' }}>
              <span className="legend-item"><span className="dot-estimated"></span> Est.</span>
              <span className="legend-item"><span className="dot-actual"></span> Actual</span>
            </div>
          </div>

        </div>

        {/* BARRA DE PROGRESO GLOBAL */}
        <div className="sprint-global-progress">
          <p className="progress-text">Global Completion: {totalPercent}%</p>
          <div className="progress-bar-background">
            <div className="progress-bar-fill" style={{ width: `${totalPercent}%` }}></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MyComTasks;