import React from "react";
import './DashboardLayout.css';
import Sidebar from "./Sidebar";
import TablaCard from "./TablaCard";

export default function DashboardLayoutUser({ title, children }) {
    const menuItems = [
    { id: 1, ruta: 'perfil', label: 'Mi perfil', icon: 'bi-person-fill'},
    { id: 2, ruta: 'miEquipo', label: 'Mi equipo', icon: 'bi-people-fill' },
    { id: 3, ruta: 'torneosDisponibles', label: 'Torneos', icon: 'bi-trophy-fill' },
    { id: 4, ruta: 'elegir-equipo', label: 'Elegir equipo', icon: 'bi-card-checklist' },
  ];

  const encabezados = ["Imagen", "Lider", "Estado",  "Acciones"];
  const datos = [
    { id: 1, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", estado: "En torneo" },
  ];
  const acciones = [
    { accion: "Ver", icon: "bi-eye-fill" },
  ];
  return (
    <div className="dashboard-layout">
      <Sidebar menuItems={menuItems} />
      <div className="mainContent container-fluid">
        <div className="row">
          <div className="col-12">
            <TablaCard
              encabezados={encabezados}
              datos={datos}
              acciones={acciones}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
