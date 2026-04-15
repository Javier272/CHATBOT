import { useState, useEffect } from "react";

function MyComTasks() {

  const [data, setData] = useState([]);

  useEffect(() => {
    const fakeData = [
      { label: "Lunes", value: 4 },
      { label: "Martes", value: 7 },
      { label: "Miércoles", value: 3 },
      { label: "Jueves", value: 6 },
      { label: "Viernes", value: 5 }
    ];

    setData(fakeData);
  }, []);

  return (
    <section id="cont">
      <h2> My Completed Tasks</h2>
      <h2></h2>

      <div className="chart">
        {data.map((item, index) => (
          <div key={index} className="bar-container">
            <div 
              className="bar" 
              style={{ height: `${item.value * 20}px` }}
            ></div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default MyComTasks;