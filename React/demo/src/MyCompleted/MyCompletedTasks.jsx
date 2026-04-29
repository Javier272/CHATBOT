import { useState, useEffect } from "react";
import "./MyCompletedTasks.css";

function MyComTasks({ tasks = [] }) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  
  // 1. Cálculo de escala para el eje Y (Histograma)
  const maxHoursRaw = Math.max(...safeTasks.map(t => Math.max(Number(t.hoursEstimate) || 0, Number(t.realHours) || 0)), 0);
  // Aseguramos que el eje tenga al menos 1h para mostrarse
  const maxAxis = maxHoursRaw > 0 ? Math.ceil(maxHoursRaw) : 1; 
  const ticks = Array.from({ length: maxAxis + 1 }, (_, i) => i).reverse();

  // 2. Filtros para la dona y leyendas
  const total = safeTasks.length;
  const completed = safeTasks.filter(t => t.status === "completed").length;
  const started = safeTasks.filter(t => t.status === "in_progress" || t.status === "doing").length;
  const pending = safeTasks.filter(t => t.status === "pending").length;

  const totalPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

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
                  {/* Recuperamos la leyenda de To Do */}
                  <span className="legend-item"><span className="dot-pending"></span> {pending} To Do</span>
                </div>
              </div>
            </div>
          </div>

          {/* GRÁFICA DE BARRAS (COMPARATIVA DE HORAS) */}
          <div className="bar-chart-section">
            <h3 className="chart-title">Hours per Task (Comparison)</h3>
            <div className="chart-with-axis">
              {/* Eje Y dinámico basado en horas */}
              <div className="axis-y">
                {ticks.map(tick => (
                  <div key={tick} className="axis-tick">
                    <span>{tick}h</span>
                    <div className="grid-line"></div>
                  </div>
                ))}
              </div>

              <div className="bar-chart-viewport">
                {safeTasks.map((task) => (
                  <div key={task.id} className="bar-chart-group">
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
                    <span className="chart-user-name">{task.title}</span>
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