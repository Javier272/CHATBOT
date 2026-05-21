import { useMemo } from "react";
import "./MyCompletedTasks.css";

const PRIORITY_BUCKETS = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

function cleanStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function getRealHours(task) {
  return Number(task?.REAL_HOURS ?? task?.real_hours ?? task?.realHours ?? 0) || 0;
}

function getEstimatedHours(task) {
  return Number(task?.HOURS_ESTIMATE ?? task?.hours_estimate ?? task?.hoursEstimate ?? 0) || 0;
}

function getPriorityBucket(priority) {
  const value = Number(priority) || 0;
  if (value >= 4) return "high";
  if (value >= 2) return "medium";
  return "low";
}

function getSprintName(task) {
  return task?.sprint || task?.SPRINT || "Sin Sprint";
}

function sortSprintEntries(entries) {
  return entries.sort(([a], [b]) => {
    const numA = Number(a);
    const numB = Number(b);

    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  });
}

function getAxisMax(maxValue) {
  const safeMax = Math.max(Number(maxValue) || 0, 0);
  return Math.max(4, Math.ceil(safeMax / 4) * 4);
}

function getTicks(maxValue, suffix = "") {
  const top = getAxisMax(maxValue);

  return Array.from({ length: 5 }, (_, index) => {
    const rawValue = top - index * (top / 4);
    const value = Number.isInteger(rawValue) ? rawValue : Number(rawValue.toFixed(1));
    return {
      value,
      label: `${value}${suffix}`,
    };
  });
}

function EmptyChartMessage({ text }) {
  return <div className="individual-empty-chart">{text}</div>;
}

function VerticalBarChart({
  ticks,
  maxValue,
  children,
  legend,
  empty,
}) {
  return (
    <>
      <div className="individual-chart-with-axis">
        <div className="individual-axis-y">
          {ticks.map((tick, index) => (
            <div key={`${tick.label}-${index}`} className="individual-axis-tick">
              <span>{tick.label}</span>
            </div>
          ))}
        </div>

        <div className="individual-chart-scroll-wrapper">
          <div className="individual-bar-chart-viewport">
            {maxValue > 0 ? children : <EmptyChartMessage text={empty} />}
          </div>
        </div>
      </div>

      {legend && <div className="individual-chart-legend">{legend}</div>}
    </>
  );
}

function LegendItem({ dotClass, children }) {
  return (
    <div className="individual-legend-item">
      <span className={`individual-legend-dot ${dotClass}`}></span>
      <span>{children}</span>
    </div>
  );
}

function MyComTasks({ tasks = [] }) {
  const safeTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);

  const analytics = useMemo(() => {
    const completedTasks = safeTasks.filter((task) => cleanStatus(task.status || task.STATUS) === "completed");
    const startedTasks = safeTasks.filter((task) => {
      const status = cleanStatus(task.status || task.STATUS);
      return status === "in_progress" || status === "doing" || status === "started";
    });
    const pendingTasks = safeTasks.filter((task) => cleanStatus(task.status || task.STATUS) === "pending");

    const priorityTotals = PRIORITY_BUCKETS.map((bucket) => ({
      ...bucket,
      value: completedTasks.filter((task) => getPriorityBucket(task.priority ?? task.PRIORITY) === bucket.key).length,
    }));

    const sprintMap = completedTasks.reduce((acc, task) => {
      const sprint = getSprintName(task);
      if (!acc[sprint]) {
        acc[sprint] = {
          sprint,
          completed: 0,
          realHours: 0,
        };
      }

      acc[sprint].completed += 1;
      acc[sprint].realHours += getRealHours(task);
      return acc;
    }, {});

    const sprintTotals = sortSprintEntries(Object.entries(sprintMap)).map(([, value]) => value);
    const maxHoursPerTask = Math.max(
      ...safeTasks.map((task) => Math.max(getEstimatedHours(task), getRealHours(task))),
      0
    );

    return {
      total: safeTasks.length,
      completed: completedTasks.length,
      started: startedTasks.length,
      pending: pendingTasks.length,
      priorityTotals,
      sprintTotals,
      maxHoursPerTask,
      maxPriority: Math.max(...priorityTotals.map((item) => item.value), 0),
      maxSprintTasks: Math.max(...sprintTotals.map((item) => item.completed), 0),
      maxSprintHours: Math.max(...sprintTotals.map((item) => item.realHours), 0),
    };
  }, [safeTasks]);

  const statusPercentages = {
    completed: analytics.total > 0 ? (analytics.completed / analytics.total) * 100 : 0,
    started: analytics.total > 0 ? (analytics.started / analytics.total) * 100 : 0,
  };
  const hoursPerTaskAxisMax = getAxisMax(analytics.maxHoursPerTask);
  const priorityAxisMax = getAxisMax(analytics.maxPriority);
  const sprintTasksAxisMax = getAxisMax(analytics.maxSprintTasks);
  const sprintHoursAxisMax = getAxisMax(analytics.maxSprintHours);

  return (
    <section className="individual-dashboard-container">
      <h2 className="individual-dashboard-title-main">Tasks Overview</h2>

      <div className="individual-dashboard-card">
        <div className="individual-dashboard-grid">
          <div className="individual-chart-section individual-status-card">
            <h3 className="individual-chart-title">Status Distribution</h3>
            <div className="individual-pie-chart-viewport">
              <div
                className={`individual-pie-chart ${analytics.total === 0 ? "empty" : ""}`}
                style={{
                  "--completed": `${statusPercentages.completed}%`,
                  "--started": `${statusPercentages.started}%`,
                }}
              >
                <div className="individual-pie-chart-center"></div>
              </div>

              <div className="individual-status-legend">
                <LegendItem dotClass="individual-dot-done">{analytics.completed} Done</LegendItem>
                <LegendItem dotClass="individual-dot-doing">{analytics.started} Doing</LegendItem>
                <LegendItem dotClass="individual-dot-todo">{analytics.pending} To Do</LegendItem>
              </div>
            </div>
          </div>

          <div className="individual-chart-section">
            <h3 className="individual-chart-title">Completed Tasks per Priority</h3>
            <VerticalBarChart
              ticks={getTicks(analytics.maxPriority)}
              maxValue={analytics.maxPriority}
              empty="No completed priority data"
            >
              {analytics.priorityTotals.map((item) => (
                <div key={item.key} className="individual-single-bar-group">
                  <div className="individual-bar-track-wrapper">
                    <div
                      className={`individual-bar-fill priority-${item.key}`}
                      style={{ height: `${(item.value / priorityAxisMax) * 100}%` }}
                    />
                  </div>
                  <span className="individual-chart-label">{item.label}</span>
                </div>
              ))}
            </VerticalBarChart>
          </div>

          <div className="individual-chart-section individual-wide-chart">
            <h3 className="individual-chart-title">Hours per Task (Comparison)</h3>
            <VerticalBarChart
              ticks={getTicks(analytics.maxHoursPerTask, "h")}
              maxValue={safeTasks.length}
              empty="No task hours available"
              legend={
                <>
                  <LegendItem dotClass="individual-dot-estimated">Estimated</LegendItem>
                  <LegendItem dotClass="individual-dot-actual">Actual</LegendItem>
                </>
              }
            >
              {safeTasks.map((task) => {
                const estimatedHours = getEstimatedHours(task);
                const realHours = getRealHours(task);

                return (
                  <div key={task.id || task.ID || task.title} className="individual-bar-chart-group">
                    <div className="individual-bars-vertical-container">
                      <div className="individual-bar-track-wrapper">
                        <div
                          className="individual-bar-fill estimated"
                          style={{ height: `${(estimatedHours / hoursPerTaskAxisMax) * 100}%` }}
                        />
                      </div>
                      <div className="individual-bar-track-wrapper">
                        <div
                          className="individual-bar-fill actual"
                          style={{ height: `${(realHours / hoursPerTaskAxisMax) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="individual-chart-label" title={task.title || task.TITLE || "Untitled task"}>
                      {task.title || task.TITLE || "Untitled task"}
                    </span>
                  </div>
                );
              })}
            </VerticalBarChart>
          </div>

          <div className="individual-chart-section">
            <h3 className="individual-chart-title">Completed Tasks per Sprint</h3>
            <VerticalBarChart
              ticks={getTicks(analytics.maxSprintTasks)}
              maxValue={analytics.maxSprintTasks}
              empty="No completed sprint data"
            >
              {analytics.sprintTotals.map((item) => (
                <div key={`tasks-${item.sprint}`} className="individual-single-bar-group">
                  <div className="individual-bar-track-wrapper">
                    <div
                      className="individual-bar-fill completed"
                      style={{ height: `${(item.completed / sprintTasksAxisMax) * 100}%` }}
                    />
                  </div>
                  <span className="individual-chart-label">
                    {item.sprint === "Sin Sprint" ? item.sprint : `Sprint ${item.sprint}`}
                  </span>
                </div>
              ))}
            </VerticalBarChart>
          </div>

          <div className="individual-chart-section">
            <h3 className="individual-chart-title">Hours Worked per Sprint</h3>
            <VerticalBarChart
              ticks={getTicks(analytics.maxSprintHours, "h")}
              maxValue={analytics.maxSprintHours}
              empty="No sprint hours available"
            >
              {analytics.sprintTotals.map((item) => (
                <div key={`hours-${item.sprint}`} className="individual-single-bar-group">
                  <div className="individual-bar-track-wrapper">
                    <div
                      className="individual-bar-fill actual"
                      style={{ height: `${(item.realHours / sprintHoursAxisMax) * 100}%` }}
                    />
                  </div>
                  <span className="individual-chart-label">
                    {item.sprint === "Sin Sprint" ? item.sprint : `Sprint ${item.sprint}`}
                  </span>
                </div>
              ))}
            </VerticalBarChart>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MyComTasks;
