import React, { useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './componentes/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import UserDashboard from './pages/UserDashboard';
import DashboardLayoutUserGraficas from './componentes/DashboardLayoutUserGraficas';
import Forbidden from './pages/Forbidden';
import HomeRedirect from './pages/HomeRedirect';
import CrearCuenta from './componentes/CrearCuenta';
import CrearTorneo from './componentes/crearTorneo';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import TorneoEnCurso from './pages/TorneoEnCurso';
import VerTorneoGuardado from './pages/TorneoGuardado';
import PerfilDashboardManager from './pages/PerfilDashboardManager';
import TorneosDisponibless from './pages/TorneosDisponibles';
import Perfil from './pages/Perfil';
import DashboardJugadoresPage from './pages/DashboardJugadores';
import EquiposPage from './pages/Equipos'; // <-- ya existente
import JugadoresUserPage from './pages/JugadoresUser'; // <-- nueva importación
import ResetPassword from './componentes/ResetPassword';



function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container mt-5 text-center">Cargando sesión...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Mapear roles del backend (ROLE_JUGADOR, ROLE_ORGANIZADOR, ROLE_ADMINISTRADOR)
  // a los roles usados en el frontend ('user', 'manager', 'admin').
  const roleMap = {
    'ROLE_JUGADOR': 'user',
    'ROLE_ORGANIZADOR': 'manager',
    'ROLE_ADMINISTRADOR': 'admin'
  };

  const backendRole = user?.role;
  const mappedRole = backendRole ? (roleMap[backendRole] || backendRole) : null;
  console.log('User role:', backendRole, '-> mapped:', mappedRole);

  if (!user && location.pathname !== "/login") {
  return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permitir si allowedRoles contiene el rol mapeado o el rol original (por compatibilidad)
  if (!mappedRole || (!allowedRoles.includes(mappedRole) && !allowedRoles.includes(backendRole))) {
    return <Navigate to="/forbidden" replace />;
  }
  return children;
}

export default function App() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const equiposInscritos = [
    { id: 1, nombre: "Los RayosInsnos FC", imagen: "https://marketplace.canva.com/EAF7dNjM5fg/1/0/1600w/canva-logos-con-iniciales-para-nombre-sencillo-tipogr%C3%A1fico-circular-blanco-y-negro-iIOpW3mk-yQ.jpg" },
    { id: 2, nombre: "Tigres del Norte", imagen: "https://cdn.shopify.com/s/files/1/0229/0839/files/image4_d9f93edc-fdfc-4f66-889a-d91312011fcf.jpg?v=1732471839" },
    { id: 3, nombre: "Ángeles azules", imagen: "https://img.local.mx/cdn-cgi/image/quality=75,format=auto,onerror=redirect/2018/06/destacada-escudo.jpg" },
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
  };

  const userData = {
    rol: 'Jugador',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    username: 'juanperez',
    intereses: [], // Array de juegos de RAWG: [{id: 1, name: 'The Legend of Zelda', background_image: 'url'}]
    stats: {
      equipo: 'Los Rayos FC',
      victorias: 15,
      torneosJugados: 5
    }
  };

  const handleUpdate = (updatedData) => {
    // Llama a tu API o state global para guardar
    console.log('Datos actualizados:', updatedData);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1000 }}>
          <button
            className="btn btn-primary btn-sm rounded-circle"
            onClick={togglePlayPause}
            title={isPlaying ? 'Pausar Música' : 'Reproducir Música'}
            style={{ backgroundColor: '#4A3287', border: 'none' }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
        <audio ref={audioRef} src="src/assets/audio/BandaSonora.mp3" loop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<CrearCuenta />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          
          <Route path="/admin" element={<ProtectedRoute><RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute></ProtectedRoute>} />
          <Route path="/user" element={<ProtectedRoute><RoleRoute allowedRoles={['user']}><DashboardJugadoresPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/jugadoresUser" element={<ProtectedRoute><RoleRoute allowedRoles={['user']}><JugadoresUserPage /></RoleRoute></ProtectedRoute>} />{/* <-- nueva ruta para rol user */}
          <Route path="/equipos" element={<ProtectedRoute><RoleRoute allowedRoles={['admin','manager','user']}><EquiposPage /></RoleRoute></ProtectedRoute>} />{/* <-- nueva ruta */}
          <Route path="/manager" element={<ProtectedRoute><RoleRoute allowedRoles={['manager']}><ManagerDashboard /></RoleRoute></ProtectedRoute>} />
          <Route path="/torneos" element={<ProtectedRoute><RoleRoute allowedRoles={['manager']}><ManagerDashboard /></RoleRoute></ProtectedRoute>} />
          {/* <Route path="/user" element={<ProtectedRoute><RoleRoute allowedRoles={['user']}><UserDashboard /></RoleRoute></ProtectedRoute>} /> */}
          <Route path="/torneosDisponibles" element={<ProtectedRoute><RoleRoute allowedRoles={['user',]}><TorneosDisponibless /></RoleRoute></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><RoleRoute allowedRoles={['user','admin','manager']}><Perfil userData={userData} onUpdate={handleUpdate}/></RoleRoute></ProtectedRoute>} />

          <Route path="/elegir-equipo" element={<ProtectedRoute><RoleRoute allowedRoles={['user',]}><UserDashboard /></RoleRoute></ProtectedRoute>} />
          <Route path="/miEquipo" element={<ProtectedRoute><RoleRoute allowedRoles={['user']}><DashboardLayoutUserGraficas /></RoleRoute></ProtectedRoute>} />
          {/* <Route path="/crearTorneo" element={<ProtectedRoute><RoleRoute allowedRoles={['manager']}><CrearTorneo estado="Nuevo"/></RoleRoute></ProtectedRoute>} />
          <Route path="/TorneoEnCurso/:id" element={<ProtectedRoute><RoleRoute allowedRoles={['manager']}><CrearTorneo estado="En curso" datosGuardados={datosTorneo} equipos={equiposInscritos} /></RoleRoute></ProtectedRoute>} />
          <Route path="/TorneoGuardado/:id" element={<ProtectedRoute><RoleRoute allowedRoles={['manager']}><CrearTorneo estado="Guardado"datosGuardados={datosTorneo} /></RoleRoute></ProtectedRoute>} /> */}
          <Route path="/crearTorneo" element={<ProtectedRoute><RoleRoute allowedRoles={['manager']}><CrearTorneo estado="Nuevo" /></RoleRoute></ProtectedRoute>} />

          <Route path="/TorneoGuardado/:id" element={<ProtectedRoute><RoleRoute allowedRoles={['manager']}><CrearTorneo estado="Guardado" /></RoleRoute></ProtectedRoute>} />

          <Route path="/TorneoEnCurso/:id" element={<ProtectedRoute><RoleRoute allowedRoles={['manager', 'user']}><CrearTorneo estado="En curso" /></RoleRoute></ProtectedRoute>} />


          <Route path="/forbidden" element={<Forbidden />} /> 
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<div className="container mt-5">Página no encontrada</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
