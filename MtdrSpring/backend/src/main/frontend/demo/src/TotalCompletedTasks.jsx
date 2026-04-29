import { useMemo } from "react";
import "./TotalCompletedTasks.css";

function TotalCompletedTasks({ tasks }) {

  const userStats = useMemo(() => {
    const stats = {};

    tasks.forEach((t) => {
      const userId = t.userId;

      if (!stats[userId]) {
        stats[userId] = { completed: 0, total: 0 };
      }

      stats[userId].total += 1;

      if (t.status === "completed") {
        stats[userId].completed += 1;
      }
    });

    return stats;
  }, [tasks]);

  const users = Object.keys(userStats);

  if (tasks.length === 0) return <p>No hay datos disponibles</p>;

  return (
    <section className="bar-chart-section">
      <h2>Total Tasks by User</h2>

      <div className="bar-chart">
        {users.map((userId) => {
          const { completed, total } = userStats[userId];
          const percentage = (completed / total) * 100;

          return (
            <div key={userId} className="bar-group">
              
              {/* 👇 mostramos userId */}
              <span className="user-name">User {userId}</span>

              <div className="bar-track">
                <div 
                  className="bar-fill" 
                  style={{ height: `${percentage}%` }}
                ></div>
              </div>

              <span className="bar-label">
                {completed} / {total}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TotalCompletedTasks;