// import React from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function Sidebar({ menuItems = [] }) {
//   const { user, logout } = useAuth();
//   console.log('Rendering Sidebar for user:', user);

//   const iconMap = {
//     admin: 'bi-person-fill',
//     manager: 'bi-people-fill',
//     user: 'bi-trophy-fill',
//   };


//   return (
//     <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#00A6A6' }}>
//       <div className="container-fluid">
//         <Link className="navbar-brand d-flex align-items-center" to="/">
//           <img src="/src/assets/imagenes/Logo.png" alt="logo" style={{ height: 36, marginRight: 8 }} />
//           LIGAMER
//         </Link>
//         <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#ligamerNavbar" aria-controls="ligamerNavbar" aria-expanded="false" aria-label="Toggle navigation">
//           <span className="navbar-toggler-icon"></span>
//         </button>

//         <div className="collapse navbar-collapse" id="ligamerNavbar">
//           <ul className="navbar-nav me-auto mb-2 mb-lg-0">
//             {menuItems.map(item => (
//               <li className="nav-item" key={item.id}>
//                 <Link className="nav-link" to={`/${item.ruta}`}>
//                   {item.label} <i className={`${item.icon || 'bi-circle-fill'}`} style={{ marginLeft: 6 }}></i>
//                 </Link>
//               </li>
//             ))}
//           </ul>

//           <div className="d-flex align-items-center">
{/* <span className="navbar-text me-3" style={{ color: '#fff' }}>
              {user ? `Usuario: ${user.username || user?.username || ''}` : ''}
            </span> */}
//             <Link to="/perfil" className="btn btn-outline-light btn-sm" style={{margin:5}}>
//               <span className="navbar-text me-3" style={{ color: '#fff' }}> {user.role ? ` ${user.role || user?.user || 'Finny_231'}` : 'Perfil Finny_231'} </span>
//             </Link>
//             <button className="btn btn-outline-light btn-sm" onClick={logout}>Cerrar sesión</button>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }


import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestToTeams, manageJoinRequest } from '../utils/Service/usuario';
import { getAllMyTournaments, getTournamentJoinRequests, getAllPendingJoinRequests, respondTournamentJoinRequest, searchUserByEmail } from '../utils/Service/General';
import Swal from 'sweetalert2';



export default function Sidebar({ menuItems = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]); // solicitudes de equipo
  const [infoNotificaciones, setInfoNotificaciones] = useState([]); // eventos informativos (p.ej. abandono)
  const [torneoNotificaciones, setTorneoNotificaciones] = useState([]); // solicitudes a torneos
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [username, setUsername] = useState('');

  const getCorreoFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);
      return payload.sub || null;
    } catch (error) {
      console.error('Token inválido:', error);
      return null;
    }
  };

  // Cargar solicitudes al montar el componente
  useEffect(() => {
    if (user?.teamId) {
      loadJoinRequests();
    }
    if (user && (user.role === 'ROLE_ORGANIZADOR' || user.role === 'ROLE_ADMINISTRADOR' || user.role === 'manager' || user.role === 'admin')) {
      loadTournamentRequests();
    }
  }, [user]);

  useEffect(() => {
    const email = getCorreoFromToken();
    if (!email) return;

    searchUserByEmail(email)
      .then((data) => {
        setUsername(data?.username || data?.email || '');
      })
      .catch((err) => {
        console.error('Error obteniendo usuario para sidebar:', err);
        setUsername('');
      });
  }, [user]);

  const loadJoinRequests = async () => {
    if (!user?.teamId) return;

    try {
      const requests = await requestToTeams(user.teamId);
      console.log('Solicitudes obtenidas:', requests);

      const pendingRequests = requests.filter(request => request.status === 'PENDING');
      const infoRequests = requests.filter(request => request.status === 'LEFT_INFO');
      setNotificaciones(pendingRequests);
      setInfoNotificaciones(infoRequests);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    }
  };

  const handleAceptar = async (requestId) => {
    if (!user?.teamId) return;

    setLoading(true);
    try {
      await manageJoinRequest(user.teamId, requestId, 'ACCEPT');

      Swal.fire({
        icon: 'success',
        title: 'Solicitud aceptada',
        text: 'El jugador ha sido agregado al equipo',
        confirmButtonColor: '#4A3287'
      });

      // Remover la notificación de la lista
      setNotificaciones(prev => prev.filter(n => n.id !== requestId));
    } catch (error) {
      console.error('Error aceptando solicitud:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data || 'No se pudo aceptar la solicitud',
        confirmButtonColor: '#4A3287'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async (requestId) => {
    if (!user?.teamId) return;

    setLoading(true);
    try {
      await manageJoinRequest(user.teamId, requestId, 'REJECT');

      Swal.fire({
        icon: 'info',
        title: 'Solicitud rechazada',
        text: 'La solicitud ha sido rechazada',
        confirmButtonColor: '#4A3287'
      });

      // Remover la notificación de la lista
      setNotificaciones(prev => prev.filter(n => n.id !== requestId));
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data || 'No se pudo rechazar la solicitud',
        confirmButtonColor: '#4A3287'
      });
    } finally {
      setLoading(false);
    }
  };

  // Solicitudes de torneos (organizador/admin)
  const loadTournamentRequests = async () => {
    try {
      const resp = await getAllPendingJoinRequests();
      const requests = resp.data || [];
      setTorneoNotificaciones(requests);
    } catch (error) {
      console.error('Error cargando solicitudes de torneos:', error);
    }
  };

  const handleAceptarTorneo = async (tournamentId, requestId) => {
    setLoading(true);
    try {
      await respondTournamentJoinRequest(tournamentId, requestId, 'ACCEPTED');
      Swal.fire({
        icon: 'success',
        title: 'Solicitud aceptada',
        text: 'El equipo ha sido añadido al torneo',
        confirmButtonColor: '#4A3287'
      });
      setTorneoNotificaciones(prev => prev.filter(n => n.id !== requestId));
    } catch (error) {
      console.error('Error aceptando solicitud torneo:', error);
      const msg = error?.response?.data?.message || error?.response?.data || error.message || 'No se pudo aceptar la solicitud';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonColor: '#4A3287'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRechazarTorneo = async (tournamentId, requestId) => {
    setLoading(true);
    try {
      await respondTournamentJoinRequest(tournamentId, requestId, 'REJECTED');
      Swal.fire({
        icon: 'info',
        title: 'Solicitud rechazada',
        text: 'La solicitud ha sido rechazada',
        confirmButtonColor: '#4A3287'
      });
      setTorneoNotificaciones(prev => prev.filter(n => n.id !== requestId));
    } catch (error) {
      console.error('Error rechazando solicitud torneo:', error);
      const msg = error?.response?.data?.message || error?.response?.data || error.message || 'No se pudo rechazar la solicitud';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonColor: '#4A3287'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLogoutLoading(true);
    // Simular un pequeño tiempo o simplemente ejecutar
    setTimeout(() => {
      logout();
      navigate('/login');
      setLogoutLoading(false);
    }, 500); // Pequeño delay visual de 0.5s para que se note la acción
  };

  const unreadCount = notificaciones.length + torneoNotificaciones.length + infoNotificaciones.length;

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#00A6A6' }}>
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img src="/src/assets/imagenes/Logo.png" alt="logo" style={{ height: 36, marginRight: 8 }} />
            LIGAMER
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#ligamerNavbar"
            aria-controls="ligamerNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="ligamerNavbar">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {menuItems.map(item => (
                <li className="nav-item" key={item.id}>
                  <Link className="nav-link" to={`/${item.ruta}`}>
                    {item.label} <i className={`${item.icon || 'bi-circle-fill'}`} style={{ marginLeft: 6 }}></i>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center">
              <Link to="/perfil" className="btn btn-outline-light btn-sm" style={{ margin: 5 }}>
                <span className="navbar-text me-3" style={{ color: '#fff', display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <small style={{ fontSize: '0.75rem', opacity: 0.85 }}>{username || 'Cargando...'}</small>
                  <span style={{ fontWeight: 600 }}>Mi perfil</span>
                </span>
              </Link>

              {/* Ícono de notificaciones */}
              <div className="position-relative me-3">
                <button
                  className="btn btn-outline-light btn-sm position-relative p-2"
                  onClick={() => setShowModal(true)}
                  style={{ lineHeight: 1 }}
                >
                  <i className="bi bi-bell-fill"></i>
                  {unreadCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: '0.65rem' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleLogout}
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <div className="spinner-border spinner-border-sm text-light" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                ) : (
                  'Cerrar sesión'
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modal de notificaciones */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Solicitudes pendientes</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {unreadCount === 0 && (
                  <p className="text-center text-muted">No tienes solicitudes pendientes</p>
                )}

                {infoNotificaciones.length > 0 && (
                  <>
                    <h6 className="mb-2">Avisos de tu equipo</h6>
                    {infoNotificaciones.map(notif => (
                      <div key={`info-${notif.id}`} className="card mb-3 border-warning">
                        <div className="card-body d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{notif.user?.nombre || notif.user?.email}</strong> abandonó el equipo
                            <div className="text-muted small">
                              Fecha: {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : ''}
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-warning text-dark">Aviso</span>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              title="Marcar como leído"
                              onClick={() => setInfoNotificaciones(prev => prev.filter(n => n.id !== notif.id))}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {notificaciones.length > 0 && (
                  <>
                    <h6 className="mb-2">Solicitudes a tu equipo</h6>
                    {notificaciones.map(notif => (
                      <div key={`team-${notif.id}`} className="card mb-3">
                        <div className="card-body d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{notif.user?.nombre || notif.user?.email}</strong> quiere unirse a tu equipo
                            <div className="text-muted small">
                              Solicitado el: {new Date(notif.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <button
                              className="btn btn-success btn-sm me-2"
                              title="Aceptar"
                              onClick={() => handleAceptar(notif.id)}
                              disabled={loading}
                            >
                              {loading ? (
                                <div className="spinner-border spinner-border-sm" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              ) : (
                                <i className="bi bi-check-lg"></i>
                              )}
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Rechazar"
                              onClick={() => handleRechazar(notif.id)}
                              disabled={loading}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {torneoNotificaciones.length > 0 && (
                  <>
                    <h6 className="mb-2">Solicitudes a tus torneos</h6>
                    {torneoNotificaciones.map(notif => (
                      <div key={`tournament-${notif.id}`} className="card mb-3">
                        <div className="card-body d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{notif.teamName || notif.team?.name || 'Equipo'}</strong> solicita unirse a <strong>{notif.tournamentName || 'tu torneo'}</strong>
                            <div className="text-muted small">
                              Solicitado el: {notif.requestDate ? new Date(notif.requestDate).toLocaleDateString() : ''}
                            </div>
                          </div>
                          <div>
                            <button
                              className="btn btn-success btn-sm me-2"
                              title="Aceptar"
                              onClick={() => handleAceptarTorneo(notif.tournamentId, notif.id)}
                              disabled={loading}
                            >
                              {loading ? (
                                <div className="spinner-border spinner-border-sm" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              ) : (
                                <i className="bi bi-check-lg"></i>
                              )}
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Rechazar"
                              onClick={() => handleRechazarTorneo(notif.tournamentId, notif.id)}
                              disabled={loading}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}