import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import "./TablaCard.css";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {requestToJoinTeam, requestToTeams} from '../utils/Service/usuario';
import {assignOrganizerRole} from '../utils/Service/administrador';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../utils/Service/General';

export default function TablaCard({ encabezados = [], datos = [], acciones = [], onUnirse, actionButton }) {
  const [paginaActual, setPaginaActual] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Búsqueda con debounce
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const debounceRef = useRef(null);
  const DEBOUNCE_MS = 250;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(searchTerm);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const porPagina = 8;

  const datosFiltrados = useMemo(() => {
    const filtro = (query || "").trim().toLowerCase();
    if (!filtro) return datos;
    return datos.filter((d) =>
      Object.values(d).some((val) =>
        String(val).toLowerCase().includes(filtro)
      )
    );
  }, [query, datos]);

  useEffect(() => {
    setPaginaActual(1);
  }, [query]);

  const totalPaginas = Math.max(1, Math.ceil(datosFiltrados.length / porPagina));

  const datosPaginados = useMemo(() => {
    const start = (paginaActual - 1) * porPagina;
    return datosFiltrados.slice(start, start + porPagina);
  }, [datosFiltrados, paginaActual, porPagina]);

  const abrirModal = useCallback((fila) => {
    setFilaSeleccionada(fila);
    setModalAbierto(true);
  }, []);

  const ir = useCallback((fila) => {
    if (fila.estado === "En curso") {
      navigate(`/TorneoEnCurso/${fila.id}`, { replace: true, state: { from: fila } });
      return;
    } else if (fila.estado === "Guardado") {
      navigate(`/TorneoGuardado/${fila.id}`, { replace: true, state: { from: fila } }); 
      return;
    }
  }, [navigate]);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setFilaSeleccionada(null);
  }, []);

  // SweetAlert2 wrapper
  const MySwal = withReactContent(Swal);

  // Función para validar antes de unirse a un equipo
  const validateJoinTeam = async (teamId) => {
    try {
      // 1. Verificar si el usuario ya tiene equipo
      const profile = await getProfile();
      const userProfile = profile.data;
      
      if (userProfile.team || userProfile.ownedTeam) {
        MySwal.fire({
          icon: 'warning',
          title: 'Ya perteneces a un equipo',
          text: 'Abandona tu equipo actual para unirte a otro',
          confirmButtonColor: '#4A3287'
        });
        return false;
      }

      // 2. Verificar si ya envió solicitud a este equipo
      try {
        const requests = await requestToTeams(teamId);
        const userRequest = requests.find(request => 
          request.user?.email === user?.email && request.status === 'PENDING'
        );
        
        if (userRequest) {
          MySwal.fire({
            icon: 'warning',
            title: 'Solicitud ya enviada',
            text: 'Ya tienes una solicitud pendiente para unirte a este equipo. Espera a que el administrador del equipo revise tu solicitud.',
            confirmButtonColor: '#4A3287'
          });
          return false;
        }
      } catch (error) {
        // Si no puede obtener las solicitudes, continuar (podría ser que no tenga permisos)
        console.log('No se pudieron verificar solicitudes previas:', error);
      }

      return true;
    } catch (error) {
      console.error('Error validando estado del usuario:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'No se pudo verificar tu estado actual. Por favor, intenta de nuevo.',
        confirmButtonColor: '#4A3287'
      });
      return false;
    }
  };

  // Función genérica que pide confirmación y ejecuta la acción
  const handleAccionClick = useCallback((accionObj, fila, e) => {
    if (e) e.stopPropagation();
    const accion = accionObj?.accion || "Acción";

    // Obtener el nombre/título del elemento de forma más robusta
    const nombreElemento = fila.nombre || fila.name || fila.tournamentName || 'elemento';
    
    let alertConfig = {
      title: `${accion} torneo`,
      text: `Ingresar para ver los datos del torneo: ${nombreElemento}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4A3287',
      cancelButtonColor: '#dc3545',
      reverseButtons: true
    };

    if (accion === "Unirse") {
      const nombreEquipo = fila.name || fila.nombre || 'este equipo';
      alertConfig.title = `¿Deseas unirte al equipo "${nombreEquipo}"?`;
      alertConfig.text = `Al confirmar, se enviará una solicitud para unirte a este equipo. El líder revisará tu solicitud y te notificará la respuesta.`;
    }

    if (accion === "Participar") {
      const nombreTorneo = fila.tournamentName || fila.nombre || fila.name || 'este torneo';
      alertConfig.title = `¿Deseas participar en el torneo "${nombreTorneo}"?`;
      alertConfig.text = `Al confirmar, se registrará tu equipo en este torneo. El organizador revisará tu solicitud y te notificará la respuesta.`;
    }

    if (accion === "Asignar") {
      const nombreTorneo = fila.tournamentName || fila.nombre || 'este torneo';
      alertConfig.title = `¿Asignar como organizador?`;
      alertConfig.text = `Al confirmar, se asignará a esta persona como organizador.`;
    }

    MySwal.fire(alertConfig).then((result) => {
      if (!result.isConfirmed) return;

      if (accion === "Asignar") {
        MySwal.fire({
          icon: 'success',
          title: 'Organizador asignado correctamente',
          text: `Se ha asignado a "${fila.nombre || ''}" como organizador.`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#4A3287'
        }).then(() => {
         // abrirModal(fila);
          try {
            assignOrganizerRole(fila.id)
              .then((data) => { console.log("Respuesta asignar organizador:", data); })
              .catch((err) => { console.error("Error asignar organizador:", err); });
          } catch (error) {
            console.error("Error asignando organizador:", error);
          }
        });
        return;
      }
      if (accion === "Detalles") {
        abrirModal(fila);
        return;
      }
      if (accion === "Retar") {
        MySwal.fire({
          icon: 'success',
          title: 'Reto enviado',
          text: `Has retado a "${fila.nombre || ''}".`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#4A3287'
        }).then(() => {
          ir(fila);
        });
        return;
      }
      if (accion === "Ver") {
        ir(fila);
        return;
      }
      if (accion === "Unirse") {
        // Validar antes de proceder
        validateJoinTeam(fila.id).then((canJoin) => {
          if (!canJoin) return; // Si no puede unirse, salir
          
          // Si pasa las validaciones, enviar solicitud
          console.log("Solicitando unirse al equipo:", fila);
          //if (onUnirse) onUnirse(fila);
          
          requestToJoinTeam(fila.id)
            .then((data) => { 
              console.log("Respuesta unirse al equipo:", data);
              // Mostrar mensaje de éxito SOLO después de que la petición sea exitosa
              MySwal.fire({
                icon: 'success',
                title: 'Solicitud enviada exitosamente',
                text: `Tu solicitud para unirte al equipo "${fila.name || ''}" ha sido enviada. Espera respuesta del administrador.`,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#4A3287'
              });
            })
            .catch((err) => { 
              console.error("Error unirse al equipo:", err);
              // Mostrar mensaje de error si la petición falla
              const errorMessage = 'Ya has solicitado unirte a este equipo, espera respuesta del administrador';
              MySwal.fire({
                icon: 'warning',
                title: 'Solicitud duplicada',
                text: errorMessage,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#4A3287'
              });
            });
        });
        return;
      }

      if (accion === "Participar") {
        // Validar antes de proceder (similar a unirse a equipo pero para torneos)
        console.log("Solicitando participar en el torneo:", fila);
        
        // Aquí podrías agregar validaciones específicas para torneos
        // Por ejemplo: verificar si ya está registrado, si tiene equipo, etc.
        
        // Por ahora, simular el registro en torneo
        try {
          // TODO: Reemplazar con el endpoint real para registrarse en torneo
          // await registerInTournament(fila.id);
          
          MySwal.fire({
            icon: 'success',
            title: 'Registro exitoso',
            text: `Te has registrado correctamente en el torneo "${fila.tournamentName || fila.nombre || ''}". Espera confirmación del organizador.`,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#4A3287'
          });
        } catch (err) {
          console.error("Error participando en torneo:", err);
          MySwal.fire({
            icon: 'warning',
            title: 'Error en el registro',
            text: 'No se pudo completar el registro en el torneo. Intenta de nuevo más tarde.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#4A3287'
          });
        }
        return;
      }
      abrirModal(fila);
    });
  }, [MySwal, abrirModal, ir, onUnirse]);

  const renderAcciones = (fila) => {
    return acciones.map((a, index) => {
      if (a.accion === "Asignar") {
        return (
          <button
            key={index}
            className="btn-accion me-1"
            onClick={(e) => handleAccionClick(a, fila, e)}
          >
            <i className={a.icon}></i>
          </button>
        );
      }

      if (a.accion === "Detalles") {
        return (
          <button
            key={index}
            className="btn-accion me-1"
            onClick={(e) => {
              e.stopPropagation();
              abrirModal(fila);
            }}
          >
            <i className={a.icon}></i>
          </button>
        );
      }

      if (a.accion === "Ver") {
        return (
          <button
            key={index}
            className="btn-accion me-1"
            onClick={(e) => handleAccionClick(a, fila, e)}
          >
            <i className={a.icon}></i>
          </button>
        );
      }

      if (a.accion === "Retar") {
        return (
          <button
            key={index}
            className="btn-accion me-1"
            onClick={(e) => handleAccionClick(a, fila, e)}
          >
            <i className={a.icon}></i>
          </button>
        );
      }

      if (a.accion === "Unirse") {
        return (
          <button
            key={index}
            className="btn-accion me-1"
            onClick={(e) => handleAccionClick(a, fila, e)}
          >
            <i className={a.icon}></i>
          </button>
        );
      }

      if (a.accion === "Participar") {
        return (
          <button
            key={index}
            className="btn-accion me-1"
            onClick={(e) => handleAccionClick(a, fila, e)}
          >
            <i className={a.icon}></i>
          </button>
        );
      }

      return null;
    });
  };

  // Normalizamos encabezados: soportamos string o {key, label}
  const encabezadosNormalizados = useMemo(() => {
    return encabezados.map(col => {
      if (typeof col === "string") {
        return { key: col, label: col };
      }
      return { key: col.key, label: col.label ?? col.key };
    });
  }, [encabezados]);

  // Detectar si hay columna de imagen
  const tieneColumnaImagen = encabezadosNormalizados.some(
    col => col.key.toLowerCase() === "imagen"
  );

  const Row = React.memo(function Row({ fila }) {
    return (
      <div
        className="fila-card"
        onClick={() => acciones.some(a => a.accion === "Ver") && abrirModal(fila)}
      >
        {tieneColumnaImagen && (
          <div className="imagen-col">
            <img
              src={fila.imagen}
              alt={fila.nombre || "Imagen"}
              className="imagen-placeholder"
            />
          </div>
        )}

        {encabezadosNormalizados.map((col, i) => {
          if (col.key.toLowerCase() === "imagen") return null;
          if (col.key === "Acciones") {
            return (
              <div key={i} className="valor-col">
                {renderAcciones(fila)}
              </div>
            );
          }
          return (
            <div key={i} className="valor-col">
              {fila[col.key] ?? "-"}
            </div>
          );
        })}
      </div>
    );
  });

  return (
    <div className="tabla-card-container">
      {/* Buscador */}
      <div className="tabla-acciones mb-3">
        <div className="d-flex justify-content-between align-items-center gap-2">
          <input
            type="text"
            placeholder="Buscar en toda la tabla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ flex: 1 }}
          />
          {actionButton && (
            <div>
              {actionButton}
            </div>
          )}
        </div>
      </div>

      {/* Tabla con scroll horizontal */}
      <div className="tabla-scroll">
        {/* Encabezados */}
        <div className="encabezados">
          {tieneColumnaImagen && <div className="encabezado-item"></div>}
          {encabezadosNormalizados.map((col, i) => (
            <div key={i} className="encabezado-item" style={{ color: "white", textWrap: 'wrap' }}>
              {col.label}
            </div>
          ))}
        </div>

        {/* Filas */}
        <div className="filas">
          {datosPaginados.length === 0 ? (
            <div className="fila-vacia">No se encontraron resultados.</div>
          ) : (
            datosPaginados.map((fila) => (
              <Row key={fila.id} fila={fila} />
            ))
          )}
        </div>
      </div>

      {/* Paginación */}
      <div className="paginador mt-3">
        <button
          onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
          disabled={paginaActual === 1}
          className="pagina-nav"
        >
          Previous
        </button>
        {[...Array(totalPaginas)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPaginaActual(i + 1)}
            className={`pagina-btn ${paginaActual === i + 1 ? "activa" : ""}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
          disabled={paginaActual === totalPaginas}
          className="pagina-nav"
        >
          Next
        </button>
      </div>

      {/* Modal */}
      <Modal show={modalAbierto} onHide={cerrarModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalles</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {filaSeleccionada && (
            <>
              {filaSeleccionada.imagen && (
                <div className="text-center mb-3">
                  <img
                    src={filaSeleccionada.imagen}
                    alt="Imagen"
                    style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
              )}
              {/* AHORA (nunca falla) */}
              {encabezadosNormalizados
                .filter(col => col.key !== "Acciones" && col.key !== "imagen" && col.key !== "Imagen")
                .map((col, index) => {
                  const key = col.key;
                  const value = filaSeleccionada?.[key];

                  // Convertir valor a string seguro
                  const valorMostrable = (() => {
                    if (value === null || value === undefined) return "-";
                    if (typeof value === "object") {
                      // Opcional: mostrar algo más bonito si tiene nombre
                      if (value.nombre) return value.nombre;
                      if (value.name) return value.name;
                      if (value.tournamentName) return value.tournamentName;
                      return JSON.stringify(value);
                    }
                    return String(value);
                  })();

                  return (
                    <p key={key || index}>
                      <strong>{col.label}:</strong> {valorMostrable}
                    </p>
                  );
                })}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}