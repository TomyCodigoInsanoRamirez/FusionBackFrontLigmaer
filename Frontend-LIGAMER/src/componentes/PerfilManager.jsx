import React from "react";
import './DashboardLayout.css';
import Sidebar from "./Sidebar";
import TablaCard from "./TablaCard";

export default function PerfilManager({ title, children }) {
    const menuItems = [
    { id: 1, ruta: 'manager', label: 'Mi perfil', icon: 'bi-person-fill' },
    { id: 2, ruta: 'torneos', label: 'Torneos', icon: 'bi-trophy-fill' },
    { id: 3, ruta: 'crearTorneo', label: 'Crear Torneo', icon: 'bi-clipboard-check-fill' }, 
  ];

  const encabezados = ["Imagen", "Lider", "Estado",  "Acciones"];
  const datos = [
    { id: 1, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", estado: "En torneo" },
    
    

  ];
  const acciones = [
    { accion: "Ver", icon: "bi-eye-fill" },
    // Puedes agregar más acciones aquí en el futuro
  ];
  return (
    <div className="dashboard-layout">
      <div className="sideBar" style={{width:'15%', height:'100vh',backgroundColor:'#00A6A6'}}>
        <Sidebar menuItems={menuItems} />
      </div>
      <div className="mainContent" style={{width:'85%', height:'100vh'}}>
        <h1>Holas</h1>
      </div>
    </div>
  );
}
