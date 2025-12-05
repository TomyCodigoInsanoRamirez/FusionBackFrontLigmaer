import React from "react";
import './DashboardLayout.css';
import Sidebar from "./Sidebar";
import TablaCard from "./TablaCard";
import { useState, useEffect } from "react";
import { getTeamMembers, leaveTeam } from "../utils/Service/usuario";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

export default function JugadoresList() {
  const [teamMembers, setTeamMembers] = useState([]);
  const { user } = useAuth();

  const handleLeaveTeam = async () => {
    if (!user?.teamId) {
      Swal.fire({
        icon: 'warning',
        title: 'No perteneces a ningún equipo',
        text: 'No puedes salir de un equipo al que no perteneces',
        confirmButtonColor: '#4A3287'
      });
      return;
    }

    // Confirmar antes de salir
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Una vez que salgas del equipo, tendrás que solicitar unirte nuevamente si quieres volver',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#4A3287',
      confirmButtonText: 'Salir del equipo',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await leaveTeam(user.teamId);
        
        Swal.fire({
          icon: 'success',
          title: 'Has salido del equipo',
          text: 'Has salido exitosamente del equipo',
          confirmButtonColor: '#4A3287'
        }).then(() => {
          // Recargar la página o redirigir
          window.location.reload();
        });

      } catch (error) {
        console.log("ERROR COMPLETO:", error);
        console.log("ERROR BACKEND:", error.response?.data);

        const errorMessage = typeof error.response?.data === 'string' 
          ? error.response.data 
          : error.response?.data?.message || "Error al salir del equipo";

        Swal.fire({
          icon: "error",
          title: "Error al salir del equipo",
          text: errorMessage,
          confirmButtonColor: "#4A3287"
        });
      }
    }
  };
  
  const menuItems = [
    { id: 1, ruta: 'user', label: 'Jugadores', icon: 'bi-person-lines-fill' },
    { id: 2, ruta: 'equipos', label: 'Equipos', icon : 'bi-people-fill' },
    { id: 3, ruta: 'jugadoresUser', label: 'Mi equipo', icon: 'bi-person-fill-gear' },
    { id: 4, ruta: 'miEquipo', label: 'Resultados de mi equipo', icon: 'bi-bar-chart-fill' },
    { id: 5, ruta: 'torneosDisponibles', label: 'Torneos', icon: 'bi-trophy-fill' },
  ];
   const encabezados = [
    { key: "nombre", label: "Nombre" },
    { key: "email",         label: "Nombre de usuario" },
    { key: "description",    label: "Victorias" },
    { key: "description",    label: "Derrotas" },
    { key: "Acciones",       label: "Acciones" }
  ];

  const datos = [
    { id: 1, nombre: "Juan Pérez", "nombre de usuario": "juanp", victorias: 15, derrotas: 3 },
    { id: 2, nombre: "María Gómez", "nombre de usuario": "mariag", victorias: 12, derrotas: 5 },
    { id: 3, nombre: "Carlos Ruiz", "nombre de usuario": "carlr", victorias: 18, derrotas: 2 },
    { id: 4, nombre: "Ana López", "nombre de usuario": "analo", victorias: 10, derrotas: 8 },
    { id: 5, nombre: "Pedro Sánchez", "nombre de usuario": "pedros", victorias: 14, derrotas: 4 },
    { id: 6, nombre: "Sofía García", "nombre de usuario": "sofiag", victorias: 17, derrotas: 1 },
  ];


  const acciones = [
    { accion: "Detalles", icon: "bi-eye-fill" },
    // { accion: "Retar", icon: "bi-send-fill" },
  ];
  

  useEffect(() => {
    // Usar el teamId del usuario logueado desde el AuthContext
    if (!user?.teamId) {
      console.log("El usuario no pertenece a ningún equipo");
      return;
    }

    getTeamMembers(user.teamId)
      .then((data) => {
        setTeamMembers(data);
        console.log("Miembros del equipo:", data);
      })
      .catch((err) => console.error("Error obteniendo miembros:", err));
  }, [user]);

  useEffect(() => {
    console.log("Estado teamMembers actualizado:", teamMembers);
  }, [teamMembers]);

  return (
    <div className="dashboard-layout">
      <Sidebar menuItems={menuItems} />
      <div className="mainContent container-fluid">
        <div className="row">
          <div className="col-12">
            <TablaCard
              encabezados={encabezados}
              datos={teamMembers}
              acciones={acciones}
              actionButton={
                user?.teamId && (
                  <button 
                    className="btn btn-danger"
                    style={{ 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={handleLeaveTeam}
                  >
                    <i className="bi bi-box-arrow-left me-2"></i>
                    Salir del Equipo
                  </button>
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
