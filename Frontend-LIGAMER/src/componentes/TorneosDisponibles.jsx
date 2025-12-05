import React, { useEffect, useState } from "react";
import './DashboardLayout.css';
import Sidebar from "./Sidebar";
import TablaCard from "./TablaCard";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { getAllTournaments } from "../utils/Service/General";

export default function TorneosDisponibles({ title, children }) {
    const menuItems = [
    { id: 1, ruta: 'user', label: 'Jugadores', icon: 'bi-person-lines-fill' },
    { id: 2, ruta: 'equipos', label: 'Equipos', icon : 'bi-people-fill' },
    { id: 3, ruta: 'jugadoresUser', label: 'Mi equipo', icon: 'bi-person-fill-gear' },
    { id: 4, ruta: 'miEquipo', label: 'Resultados de mi equipo', icon: 'bi-bar-chart-fill' },
    { id: 5, ruta: 'torneosDisponibles', label: 'Torneos', icon: 'bi-trophy-fill' },
  ];

  //const encabezados = [ "Nombre", "Organizador", "Equipos", "Acciones"];
  const encabezados = [
    { key: "name",        label: "Nombre" },
    { key: "organizador",   label: "Organizador" }, 
    { key: "teamCount",       label: "Equipos" },
    { key: "Acciones",      label: "Acciones" }
  ];

  const datos = [
    { id: 1,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 2,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 3,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 4,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 5,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 6,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 7,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 8,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 9,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 10,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 11,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
    { id: 12,  nombre: "Liga de campeones", organizador: "Juan Spre", equipos: 16, cuposTomados: 10 },
  ];
  const acciones = [
    { accion: "Detalles", icon: "bi-eye-fill" },
    { accion: "Participar", icon: "bi-person-fill-add" },	
  ];

  const [tournament,setTournaments] = useState([]);

  const MySwal = withReactContent(Swal);
  const handleUnirse = (torneo) => {
    MySwal.fire({
      title: `¿Unirte a "${torneo.nombre}"?`,
      text: `Organizador: ${torneo.organizador}\nCupos: ${torneo.equipos}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, unirme',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4A3287',
      cancelButtonColor: '#dc3545',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Aquí pones la lógica real de unirse (API call, navegación, etc.)
        MySwal.fire({
          icon: 'success',
          title: '¡Listo!',
          text: 'Te uniste al torneo.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#4A3287'
        });
      }
    });
  };

  useEffect(() => {
    getAllTournaments()
      .then((data) => { 
        console.log("Torneos disponibles: "+data);
        setTournaments(data.data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    console.log("Estado tournaments actualizado desde la otra pantalla:", tournament);
  }, [tournament]); 
  return (
    <div className="dashboard-layout">
      <Sidebar menuItems={menuItems} />
      <div className="mainContent container-fluid">
        <div className="row">
          <div className="col-12">
            <TablaCard
              encabezados={encabezados}
              datos={tournament}
              acciones={acciones}
              onUnirse={handleUnirse}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
