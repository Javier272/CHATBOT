import "./MyCompletedTasks.css";

function MyComTasks({ tasks = [] }) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const normalizeStatus = (status) => {
    const value = String(status ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

    if (value === "done" || value === "completed") return "done";
    if (value === "doing" || value === "in_progress" || value === "started") return "doing";
    if (value === "to_do" || value === "todo" || value === "pending") return "todo";

    return value;
  };

  const getEstimatedHours = (task) =>
    Number(task.hoursEstimate ?? task.estimatedHours ?? task.ESTIMATED_HOURS ?? task.HOURS_ESTIMATE ?? 0) || 0;

  const getActualHours = (task) =>
    Number(task.realHours ?? task.actualHours ?? task.REAL_HOURS ?? task.ACTUAL_HOURS ?? 0) || 0;

  const getTaskLabel = (task, index) =>
    task.title ?? task.TITLE ?? task.name ?? task.id ?? task.ID ?? `Task ${index + 1}`;

  const maxHoursRaw = Math.max(
    ...safeTasks.map((task) => Math.max(getEstimatedHours(task), getActualHours(task))),
    0
  );
  const maxAxis = maxHoursRaw > 0 ? Math.ceil(maxHoursRaw) : 1;


  const numTicks = 5; 
const step = Math.ceil(maxAxis / (numTicks - 1)) || 1;
const ticks = [];
for (let i = 0; i <= maxAxis; i += step) {
  ticks.push(i);
}
ticks.reverse();

  // 2. Filtros para la dona y leyendas
  const total = safeTasks.length;
  const completed = safeTasks.filter((task) => normalizeStatus(task.status ?? task.STATUS) === "done").length;
  const started = safeTasks.filter((task) => normalizeStatus(task.status ?? task.STATUS) === "doing").length;
  const pending = safeTasks.filter((task) => normalizeStatus(task.status ?? task.STATUS) === "todo").length;

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
                {safeTasks.map((task, index) => (
                  <div key={task.id ?? task.ID ?? `${getTaskLabel(task, index)}-${index}`} className="bar-chart-group">
                    <div className="bars-vertical-container">
                      {/* Barra Estimada */}
                      <div className="bar-track-wrapper">
                        <div 
                          className="bar-fill estimated" 
                          style={{ height: `${(getEstimatedHours(task) / maxAxis) * 100}%` }}
                        ></div>
                      </div>
                      {/* Barra Real */}
                      <div className="bar-track-wrapper">
                        <div 
                          className="bar-fill actual" 
                          style={{ height: `${(getActualHours(task) / maxAxis) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="chart-user-name" title={String(getTaskLabel(task, index))}>
                      {getTaskLabel(task, index)}
                    </span>
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
