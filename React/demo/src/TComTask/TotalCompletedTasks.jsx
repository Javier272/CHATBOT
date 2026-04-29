import { useMemo, useState } from "react"; 
import { getAiStats } from "../taskService"; // ¡CORREGIDO: Importamos getAiStats, no priorities!
import "./TotalCompletedTasks.css";

// Añadimos currentUser a las props
function TotalCompletedTasks({ tasks = [], users = [], currentUser = null }) {
  // === ESTADOS PARA LA IA ===
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const tasksBySprint = useMemo(() => {
// ... (el resto del código sigue igual hasta handleAskAI) ...
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

  // === FUNCIÓN PARA LLAMAR AL AGILE COACH (GEMINI) ===
  // === FUNCIÓN PARA LLAMAR AL AGILE COACH (GEMINI) ===
  const handleAskAI = async () => {
    // Usamos el currentUser que viene de App.jsx (¡Mucho más seguro!)
    // Opcionalmente, podemos revisar localStorage como plan B si currentUser fallara
    const userToUse = currentUser || JSON.parse(localStorage.getItem("user"));

    if (!userToUse || !userToUse.id) {
      alert("Por favor inicia sesión para que la IA analice tus datos.");
      return;
    }

    setIsAiLoading(true);
    setAiSuggestion("");

    try {
      // Llamamos a la ruta de estadísticas usando el ID correcto
      const response = await getAiStats(userToUse.id);
      setAiSuggestion(response);
    } catch (error) {
      console.error("Error con la IA:", error);
      setAiSuggestion("Uy, Gemini está descansando. Intenta de nuevo más tarde.");
    } finally {
      setIsAiLoading(false);
    }
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

            <div className="sprint-dashboard-layout">
              {/* 1. PANEL DE HORAS */}
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
                </div>
                <div className="chart-legend-details">
                  <span className="legend-item"><span className="dot-estimated"></span> Est.</span>
                  <span className="legend-item"><span className="dot-actual"></span> Actual</span>
                </div>
              </div>

              {/* 2. PANEL DE TAREAS */}
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

      {/* === SECCIÓN DE IA: AGILE COACH HASTA ABAJO === */}
      <div className="ai-section" style={{ marginTop: "40px", padding: "20px", borderTop: "2px solid #eee" }}>
        <h3 style={{ marginBottom: "15px", color: "#333" }}>Team Insights</h3>
        <button 
          className="btn-ai-magic" 
          onClick={handleAskAI} 
          disabled={isAiLoading}
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)", // Verde para diferenciarlo del azul/morado
            color: "white", padding: "12px 24px", border: "none", borderRadius: "8px", 
            fontWeight: "bold", cursor: isAiLoading ? "not-allowed" : "pointer",
            transition: "transform 0.2s"
          }}
        >
          {isAiLoading ? "📊 Analizando productividad..." : "✨ Pedir feedback al Agile Coach (AI)"}
        </button>

        {aiSuggestion && (
          <div className="ai-response-card" style={{ 
            marginTop: "20px", padding: "20px", backgroundColor: "#f0fdf4", 
            borderLeft: "5px solid #10b981", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" 
          }}>
            <h3 style={{ color: "#047857", marginTop: 0 }}>🤖 Agile Coach AI:</h3>
            <p className="ai-text" style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#1f2937" }}>
              {aiSuggestion}
            </p>
          </div>
        )}
      </div>
      
    </div>
  );
}

export default TotalCompletedTasks;