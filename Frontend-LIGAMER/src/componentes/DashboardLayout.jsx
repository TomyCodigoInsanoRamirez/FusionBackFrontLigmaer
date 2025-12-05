import React from "react";
import './DashboardLayout.css';
import Sidebar from "./Sidebar";
import TablaCard from "./TablaCard";
import { getAllUsers } from "../utils/Service/General";
import { useEffect, useState } from "react";

export default function DashboardLayout({ title, children }) {
  const menuItems = [
    { id: 1, ruta: 'admin', label: 'Asignar Organizador', icon: 'bi-person-fill-up' },
  ];
   const encabezados = [
    { key: "nombre",         label: "Nombre" },
    { key: "email",    label: "Correo" },
    { key: "role",       label: "Rol" },
    { key: "teamName", label: "Equipo" },
    { key: "Acciones",       label: "Acciones" }
  ];
  const datos = [
    { id: 1, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    { id: 2, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    { id: 3, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    { id: 4, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    { id: 5, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    { id: 6, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    { id: 7, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    { id: 8, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    { id: 9, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Tomas", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    { id: 10, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    { id: 11, imagen: "https://i.pravatar.cc/80?img=1", nombre: "Juan", correo: "juan@x.com", rol: "Admin", estado: "Activo", fecha: "2025-10-26" },
    

  ];
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    console.log("Usuarios en estado:", users);
  }, [users]);

  const acciones = [
    { accion: "Asignar", icon: "bi-person-plus-fill"},
    { accion: "Detalles", icon: "bi-eye-fill" },
  ];
  return (
    <div className="dashboard-layout">
      <Sidebar menuItems={menuItems} />

      <div className="mainContent container-fluid">
        <div className="row">
          <div className="col-12">
            <TablaCard
              encabezados={encabezados}
              datos={users}
              acciones={acciones}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
