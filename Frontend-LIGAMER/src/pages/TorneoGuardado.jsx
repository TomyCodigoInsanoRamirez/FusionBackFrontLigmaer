import CrearTorneo from '../componentes/crearTorneo';

export default function VerTorneoGuardado() {
  const datosGuardados = {
    tournamentName: "Copa Relámpago 2025",
    description: "Torneo anual de fútbol 7 entre empresas.",
    numTeams: 16,
    startDate: "2025-06-01",
    endDate: "2025-06-15",
    registrationCloseDate: "2025-05-25",
    ruleList: [
      "3 tiempos de 15 minutos",
      "Máximo 2 cambios por equipo",
      "Empate se define por penales"
    ]
  };

  return (
    <CrearTorneo 
      estado="Guardado"
      datosGuardados={datosGuardados}
    />
  );
}

