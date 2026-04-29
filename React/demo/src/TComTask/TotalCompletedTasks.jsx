import { useMemo } from "react"; 
import "./TotalCompletedTasks.css";

function TotalCompletedTasks({ tasks = [], users = [] }) {
  
  // Agrupar todas las tareas por sprint antes de cualquier cálculo
  const tasksBySprint = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const sprint = task.sprint || "Sin Sprint";
      if (!acc[sprint]) acc[sprint] = [];
      acc[sprint].push(task);
      return acc;
    }, {});
  }, [tasks]);

  // Obtener nombre real desde backend
  const getUserName = (id) => {
    const user = users.find(u => String(u.id) === String(id));
    return user ? user.name : "Unassigned";
  };

  // 🔥 IMPORTANTE: si no hay tareas, aún así creamos estructura vacía por sprint/usuario
  const safeTasksBySprint =
    Object.keys(tasksBySprint).length > 0
      ? tasksBySprint
      : { "Sin Sprint": [] };

  return (
    <div className="pending-wrapper">
      <h2 className="pending-title-main">Tasks Dashboard by Sprint</h2>

      {/* Renderizado de bloques por cada Sprint encontrado */}
      {Object.entries(safeTasksBySprint).map(([sprintName, sprintTasks]) => {
        
        // --- LÓGICA DE CÁLCULO LOCAL POR SPRINT ---
        const totalCompleted = sprintTasks.filter((t) => t.status === "completed").length;
        const totalAll = sprintTasks.length;
        const globalPercentage = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;

        // 🔥 SI NO HAY TAREAS, AÚN ASÍ MOSTRAMOS USUARIOS
        const baseUsers = users.length > 0 ? users : [{ id: "0", name: "User 0" }];

        const userStats = baseUsers.reduce((stats, u) => {

          const userTasks = sprintTasks.filter(t => String(t.userId) === String(u.id));

          stats[u.id] = {
            completed: userTasks.filter(t => t.status === "completed").length,
            started: userTasks.filter(t => t.status === "in_progress").length,
            pending: userTasks.filter(t => t.status === "pending").length,
            total: userTasks.length,
            estimatedHours: userTasks.reduce((a, t) => a + (Number(t.estimatedHours) || 0), 0),
            actualHours: userTasks.reduce((a, t) => a + (Number(t.actualHours) || 0), 0)
          };

          return stats;
        }, {});

        const usersIds = Object.keys(userStats);

        return (
          <section key={sprintName} className="sprint-group">
            <h3 className="sprint-title">
              {sprintName === "Sin Sprint" ? sprintName : `Sprint ${sprintName}`}
            </h3>

            <div className="sprint-dashboard-layout">

              {/* Panel de Tareas */}
              <div className="tasks-chart-panel bar-chart-section">
                <h4 className="chart-title">Tasks per user</h4>

                <div className="bar-chart">
                  {usersIds.map((userId) => {
                    const { completed, started, pending, total } = userStats[userId];
                    const totalSafe = total || 1;

                    return (
                      <div key={userId} className="bar-group">
                        <div className="bars-container">

                          <div className="bar-track">
                            <div className="bar completed" style={{ height: `${(completed / totalSafe) * 100}%` }}></div>
                          </div>

                          <div className="bar-track">
                            <div className="bar started" style={{ height: `${(started / totalSafe) * 100}%` }}></div>
                          </div>

                          <div className="bar-track">
                            <div className="bar pending" style={{ height: `${(pending / totalSafe) * 100}%` }}></div>
                          </div>

                        </div>

                        <span className="user-name">{getUserName(userId)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Panel de Horas Estimadas vs Reales */}
              <div className="hours-chart-panel bar-chart-section">
                <h4 className="chart-title">Est. vs Actual Hours</h4>

                <div className="bar-chart">
                  {usersIds.map((userId) => {
                    const { estimatedHours, actualHours } = userStats[userId];
                    const maxHours = Math.max(estimatedHours, actualHours, 1);

                    return (
                      <div key={userId} className="bar-group">

                        <div className="bars-container">
                          <div className="bar-track">
                            <div className="bar estimated" style={{ height: `${(estimatedHours / maxHours) * 100}%` }}></div>
                          </div>

                          <div className="bar-track">
                            <div className="bar actual" style={{ height: `${(actualHours / maxHours) * 100}%` }}></div>
                          </div>
                        </div>

                        <span className="user-name">{getUserName(userId)}</span>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Progreso global del sprint */}
            <div className="global-progress-section" style={{ marginTop: '20px' }}>
              <p>Sprint Completion: {globalPercentage}%</p>

              <div className="percentage-container global">
                <div className="percentage-bar">
                  <div className="percentage-fill" style={{ width: `${globalPercentage}%` }}></div>
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