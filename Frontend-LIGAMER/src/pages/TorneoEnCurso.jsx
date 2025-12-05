import CrearTorneo from '../componentes/crearTorneo';
export default function TorneoEnCurso() {
  const equiposInscritos = [
    { id: 1, nombre: "Los RayosInsnos FC", imagen: "https://example.com/rayos.png" },
    { id: 2, nombre: "Tigres del Norte", imagen: "https://example.com/tigres.png" },
    { id: 3, nombre: "Ángeles azules", imagen: "https://example.com/aguilas.png" },
    { id: 4, nombre: "Team Queso", imagen: "https://img.freepik.com/vector-gratis/plantilla-logotipo-empresa-colorido-lema_23-2148802643.jpg?semt=ais_hybrid&w=740&q=80" },
    { id: 5, nombre: "Antrax", imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlyL3ObFD4gjxwAWIhL7USe5EwMSz_rbVDMw&s" },
    { id: 6, nombre: "Tebas", imagen: "https://marketplace.canva.com/EAGYIy4AT3g/1/0/1600w/canva-logo-logotipo-marca-personal-negocio-sencillo-rosa-7wtzZQePMUw.jpg" },
    { id: 7, nombre: "LUCA", imagen: "https://cdn.shopify.com/s/files/1/0229/0839/files/image31_eb5947c8-2ecc-4d9b-aced-f07c9bcffee0.jpg?v=1732471403" },
    { id: 8, nombre: "Pixar", imagen: "https://es.digitaltrends.com/wp-content/uploads/2024/04/Logo-Apple.-.jpg?resize=720%2C480&p=1" },
    // ... hasta 16, pero puede haber menos
  ];

  const datosTorneo = {
    tournamentName: "Liga Interempresas 2025",
    numTeams: 16
    // No se necesitan más datos del formulario
  };

  return (
    <CrearTorneo 
      estado="En curso"
      datosGuardados={datosTorneo}
      equipos={equiposInscritos}
    />
  );
}

