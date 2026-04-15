import { useState } from "react";

function Sidebar({ setVista }) {

  const [modo, setModo] = useState("individual");

  return (
    <section id="lateral">

      <nav className="menu-lateral">

        <button 
          className="btn-menu"
          onClick={() => setModo("individual")}
        >
          Individual
        </button>

        <button 
          className="btn-menu perfil"
          onClick={() => setModo("team")}
        >
          Team
        </button>


        <div className="tasks-buttons">
          {modo === "individual" && (
            <>
              <button className="btn-Tasks add">
                Add Task +
              </button>
              <h2></h2>

            <button className="btn-Tasks completed" onClick={() => setVista("Mycompleted")}
            >
              My Analytics
            </button>
        <h2></h2>

            <button className="btn-Tasks pending" onClick={() => setVista("pending")}>
              My Pending Tasks
            </button>
            </>
          )}

          {modo === "team" && (
            <>

              <button className="btn-Tasks add">
                Add Task +
              </button>
              <h2></h2>

              <button className="btn-Tasks pending">
                Pending Tasks
              </button>
              <h2></h2>

              <button className="btn-Tasks completed">
               Tasks Analysis
              </button>

             

            </>
          )}
        </div>
      </nav>
    </section>
  );
}

export default Sidebar;