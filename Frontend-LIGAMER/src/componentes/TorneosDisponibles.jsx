import React, { useEffect, useState } from "react";
import './DashboardLayout.css';
import Sidebar from "./Sidebar";
import TablaCard from "./TablaCard";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { getAllTournaments, requestJoinTournament, searchUserByEmail, getProfile } from "../utils/Service/General";
import { useAuth } from "../context/AuthContext";

export default function TorneosDisponibles({ title, children }) {
  const { user } = useAuth();
  const [ownerCache, setOwnerCache] = useState(null); // cache local de owner para sesión actual
  const getCorreoFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payloadBase64 = token.split(".")[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);
      return payload.sub || null;
    } catch (error) {
      console.error("Token inválido:", error);
      return null;
    }
  };
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

  const acciones = [
    { accion: "Detalles", icon: "bi-eye-fill" },
    { accion: "Participar", icon: "bi-person-fill-add" },	
  ];

  const [tournament,setTournaments] = useState([]);

  const MySwal = withReactContent(Swal);
  const handleUnirse = (torneo) => {
    const verificarPropietario = async () => {
      try {
        // Intento 1: perfil fresco (para capturar equipo recién creado)
        try {
          const profile = await getProfile();
          const ownedTeamFromProfile = profile?.ownedTeam?.id || profile?.teamId;
          if (profile?.isOwner && ownedTeamFromProfile) {
            setOwnerCache({ isOwner: true, ownedTeamId: ownedTeamFromProfile });
            return ownedTeamFromProfile;
          }
        } catch (e) {
          console.error('getProfile falló', e);
        }

        // Intento 2: SIEMPRE reconsultar por correo para evitar cache viejo
        const correo = user?.email || user?.username || getCorreoFromToken();
        const res = await searchUserByEmail(correo);
        const payload = res?.data || res; // ApiResponseDto o respuesta directa
        const isOwner = payload?.isOwner ?? payload?.data?.isOwner;
        const ownedTeamIdApi = payload?.ownedTeam?.id || payload?.data?.ownedTeam?.id;
        const ownedTeamId = ownedTeamIdApi || user?.ownedTeam?.id || user?.teamId;
        console.log("DATA PAYOAD: "+JSON.stringify(payload))
        console.log("DATA PAYOAD sin parseo: "+payload)
        if (!isOwner || !ownedTeamId) {
          MySwal.fire({
            icon: 'warning',
            title: 'Necesitas un equipo',
            text: 'Debes ser dueño de un equipo para solicitar unirte a un torneo.',
            confirmButtonColor: '#4A3287'
          });
          return null;
        }
        setOwnerCache({ isOwner: true, ownedTeamId });
        return ownedTeamId;
      } catch (error) {
        console.error('Error verificando propietario:', error);
        MySwal.fire({
          icon: 'error',
          title: 'No se pudo validar tu equipo',
          text: 'Intenta de nuevo o verifica tu sesión.',
          confirmButtonColor: '#4A3287'
        });
        return null;
      }
    };

    const nombreTorneo = torneo.tournamentName || torneo.name || torneo.nombre || 'este torneo';
    const organizador = torneo.organizerName || torneo.organizador || torneo.ownerName || 'Organizador';
    const cupos = torneo.numTeams || torneo.teamCount || torneo.equipos || 'N/D';

    verificarPropietario().then((ownedTeamId) => {
      if (!ownedTeamId) return;

      MySwal.fire({
        title: `¿Unirte a "${nombreTorneo}"?`,
        text: `Organizador: ${organizador}\nCupos: ${cupos}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, enviar solicitud',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#4A3287',
        cancelButtonColor: '#dc3545',
        reverseButtons: true
      }).then(async (result) => {
        if (!result.isConfirmed) return;

        try {
          await requestJoinTournament(torneo.id, ownedTeamId);
          MySwal.fire({
            icon: 'success',
            title: 'Solicitud enviada',
            text: 'El organizador revisará tu solicitud y asignará tu lugar.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#4A3287'
          });
        } catch (error) {
          const message = error.response?.data?.message || error.response?.data || 'No se pudo enviar la solicitud.';
          MySwal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonColor: '#4A3287'
          });
        }
      });
    });
  };

  useEffect(() => {
    getAllTournaments()
      .then((data) => { 
        const list = data.data || [];
        const normalizados = list.map(t => ({
          id: t.id,
          name: t.tournamentName || t.name,
          organizador: t.organizerName || t.organizador || t.ownerName,
          teamCount: t.teamCount ?? (t.teams ? t.teams.length : t.numTeams),
          estado: t.estado,
          raw: t,
          tournamentName: t.tournamentName || t.name // compatibilidad con TablaCard
        }));
        setTournaments(normalizados);
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
