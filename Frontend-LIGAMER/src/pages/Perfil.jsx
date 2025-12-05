import React, { useState, useEffect } from 'react';
import { Button, Form, ListGroup, Modal } from 'react-bootstrap';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import './Perfil.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { changePassword, searchUserByEmail } from '../utils/Service/General';

const MySwal = withReactContent(Swal);

export default function PerfilUsuario() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados para la información del usuario
  const [informacionUsuario, setInformacionUsuario] = useState(null);
  
  // Estados para edición de datos personales
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalData, setPersonalData] = useState({
    nombre: '',
    email: '',
    username: '',
  });
  const [personalValidation, setPersonalValidation] = useState({
    emailValid: true,
    emailMessage: '',
    usernameValid: true,
    usernameMessage: ''
  });

  // Estados para edición de contraseña
  const [editingPassword, setEditingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
    isValid: false
  });
  const [confirmPasswordValidation, setConfirmPasswordValidation] = useState({
    matches: false,
    hasValue: false
  });

  // Estados para juegos favoritos
  const [editingInterests, setEditingInterests] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [interests, setInterests] = useState([]);
  const [newGameName, setNewGameName] = useState('');

  // Obtener correo del token
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

  // Cargar información del usuario al montar el componente
  useEffect(() => {
    const email = getCorreoFromToken();
    if (email) {
      searchUserByEmail(email)
        .then((data) => {
          console.log("Información del usuario:", data);
          setInformacionUsuario(data);
          setPersonalData({
            nombre: data.nombre || '',
            email: data.email || '',
            username: data.username || '',
          });
          setInterests(data.intereses || []);
        })
        .catch((err) => console.error("Error al cargar usuario:", err));
    }
  }, []);

  // Validación de contraseña
  const validatePassword = (password) => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    validation.isValid = validation.length && validation.uppercase && validation.number && validation.special;
    setPasswordValidation(validation);
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    const validation = {
      matches: password === confirmPassword && confirmPassword !== '',
      hasValue: confirmPassword !== ''
    };
    setConfirmPasswordValidation(validation);
  };

  // Validación de datos personales
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid = true;
    let message = '';

    if (!email.trim()) {
      isValid = false;
      message = 'El correo es obligatorio';
    } else if (!emailRegex.test(email)) {
      isValid = false;
      message = 'Formato de correo inválido';
    } else {
      message = 'Correo válido';
    }

    setPersonalValidation(prev => ({
      ...prev,
      emailValid: isValid,
      emailMessage: message
    }));

    return isValid;
  };

  const validateUsername = (username) => {
    let isValid = true;
    let message = '';

    if (!username.trim()) {
      isValid = false;
      message = 'El nombre de usuario es obligatorio';
    } else if (username.length < 3) {
      isValid = false;
      message = 'Mínimo 3 caracteres';
    } else {
      message = 'Nombre de usuario válido';
    }

    setPersonalValidation(prev => ({
      ...prev,
      usernameValid: isValid,
      usernameMessage: message
    }));

    return isValid;
  };

  const handlePasswordChange = (field, value) => {
    if (field === 'old') {
      setOldPassword(value);
    } else if (field === 'new') {
      setNewPassword(value);
      validatePassword(value);
      if (confirmNewPassword) {
        validateConfirmPassword(value, confirmNewPassword);
      }
    } else if (field === 'confirm') {
      setConfirmNewPassword(value);
      validateConfirmPassword(newPassword, value);
    }
  };

  // Guardar cambios de contraseña
  const handleSavePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      MySwal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos.',
        confirmButtonColor: '#4A3287'
      });
      return;
    }

    if (!passwordValidation.isValid) {
      MySwal.fire({
        icon: 'error',
        title: 'Contraseña inválida',
        text: 'La nueva contraseña debe cumplir con todos los requisitos de seguridad.',
        confirmButtonColor: '#4A3287'
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      MySwal.fire({
        icon: 'error',
        title: 'Contraseñas no coinciden',
        text: 'La nueva contraseña y su confirmación no son iguales.',
        confirmButtonColor: '#4A3287'
      });
      return;
    }

    const result = await MySwal.fire({
      title: '¿Guardar nueva contraseña?',
      text: 'Tu contraseña será actualizada.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4A3287',
      cancelButtonColor: '#dc3545',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await changePassword({
          currentPassword: oldPassword,
          newPassword: newPassword
        });

        MySwal.fire({
          icon: 'success',
          title: '¡Contraseña actualizada!',
          text: 'Tu contraseña ha sido cambiada correctamente.',
          confirmButtonColor: '#4A3287'
        });

        // Limpiar campos
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setPasswordValidation({ length: false, uppercase: false, number: false, special: false, isValid: false });
        setConfirmPasswordValidation({ matches: false, hasValue: false });
        setEditingPassword(false);

      } catch (error) {
        MySwal.fire({
          icon: "error",
          title: "Error al actualizar contraseña",
          text: error?.response?.data?.message || "Ocurrió un error",
          confirmButtonColor: "#4A3287",
        });
      }
    }
  };

  // Guardar datos personales
  const handleSavePersonal = async () => {
    // Validar todos los campos
    const emailValid = validateEmail(personalData.email);
    const usernameValid = validateUsername(personalData.username);

    // Si algún campo no es válido, mostrar error
    if (!emailValid || !usernameValid) {
      return MySwal.fire({
        icon: 'error',
        title: 'Datos inválidos',
        text: 'Por favor, corrige los errores en el formulario antes de continuar.',
        confirmButtonColor: '#4A3287'
      });
    }

    const result = await MySwal.fire({
      title: '¿Confirmar cambios?',
      text: 'Los datos personales serán actualizados.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4A3287',
      cancelButtonColor: '#dc3545',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        // AQUÍ DEBES LLAMAR A TU ENDPOINT DE ACTUALIZAR DATOS
        // Ejemplo: await updateUserProfile(personalData);
        // Por ahora solo actualizo el estado local
        
        setInformacionUsuario({
          ...informacionUsuario,
          ...personalData
        });
        
        setEditingPersonal(false);
        MySwal.fire({
          icon: 'success',
          title: '¡Datos actualizados!',
          text: 'Tus datos se han actualizado correctamente.',
          confirmButtonColor: '#4A3287'
        });
      } catch (error) {
        MySwal.fire({
          icon: "error",
          title: "Error al actualizar datos",
          text: error?.response?.data?.message || "Ocurrió un error",
          confirmButtonColor: "#4A3287",
        });
      }
    }
  };

  // Manejo de juegos favoritos
  const handleAddInterest = () => {
    const gameName = newGameName.trim();
    if (!gameName) {
      MySwal.fire({
        icon: 'warning',
        title: 'Nombre vacío',
        text: 'Por favor escribe el nombre del juego',
        confirmButtonColor: '#4A3287'
      });
      return;
    }

    if (interests.some(g => g.title.toLowerCase() === gameName.toLowerCase())) {
      MySwal.fire({
        icon: 'info',
        title: 'Ya agregado',
        text: `"${gameName}" ya está en tu lista`,
        confirmButtonColor: '#4A3287'
      });
      return;
    }

    const newGame = {
      id: Date.now(),
      title: gameName,
      thumbnail: 'https://via.placeholder.com/80x80/2c3e50/ffffff?text=Game',
      short_description: 'Juego favorito agregado manualmente',
    };

    setInterests([...interests, newGame]);
    setNewGameName('');
    MySwal.fire({
      icon: 'success',
      title: '¡Agregado!',
      text: `"${gameName}" se añadió a tus favoritos`,
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleRemoveInterest = (id) => {
    setInterests(interests.filter(g => g.id !== id));
  };

  const handleSaveInterests = async () => {
    const result = await MySwal.fire({
      title: '¿Guardar juegos favoritos?',
      text: 'Tu lista será visible para otros usuarios.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4A3287',
      cancelButtonColor: '#dc3545',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        // AQUÍ DEBES LLAMAR A TU ENDPOINT DE ACTUALIZAR INTERESES
        // Ejemplo: await updateUserInterests(interests);
        
        setInformacionUsuario({
          ...informacionUsuario,
          intereses: interests
        });
        
        setEditingInterests(false);
        setShowAddGameModal(false);
        MySwal.fire({
          icon: 'success',
          title: '¡Lista guardada!',
          text: 'Tus juegos favoritos se actualizaron correctamente',
          confirmButtonColor: '#4A3287'
        });
      } catch (error) {
        MySwal.fire({
          icon: "error",
          title: "Error al actualizar juegos",
          text: error?.response?.data?.message || "Ocurrió un error",
          confirmButtonColor: "#4A3287",
        });
      }
    }
  };

  // Volver al dashboard según el rol
  const volver = () => {
    switch (user.role) {
      case "ROLE_ADMINISTRADOR":
        navigate('/admin');
        break;
      case "ROLE_ORGANIZADOR":
        navigate('/manager');
        break;
      case "ROLE_JUGADOR":
        navigate('/user');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="perfil-page-wrapper">
      <div className="stars-wrapper"></div>

      <div className="perfil-container">
        <div className="perfil-content">
          <div className="perfil-card">
            <div className="perfil-header">
              <h2>Perfil de usuario</h2>
              <Button className='btnVolver' onClick={volver}>Volver</Button>
            </div>

            <div className="perfil-body">
              {/* DATOS PERSONALES */}
              <div className="section-card mb-3">
                <div className="section-header">
                  <h5>Datos Personales</h5>
                  <Button size="sm" onClick={() => setEditingPersonal(true)} className="btn-edit">
                    Editar
                  </Button>
                </div>
                <div className="section-body">
                  <p><strong>Nombre:</strong> {informacionUsuario?.nombre + " " + informacionUsuario?.apellidoPaterno + " " + informacionUsuario?.apellidoMaterno || 'No definido'}</p>
                  <p><strong>Correo:</strong> {informacionUsuario?.email || 'No definido'}</p>
                  <p><strong>Usuario:</strong> {informacionUsuario?.username || 'No definido'}</p>
                </div>
              </div>

              {/* CONTRASEÑA */}
              <div className="section-card mb-3">
                <div className="section-header">
                  <h5>Contraseña</h5>
                  <Button size="sm" className="btn-edit" onClick={() => setEditingPassword(true)}>Editar</Button>
                </div>
                <div className="section-body">
                  <p>********</p>
                </div>
              </div>

              {/* JUEGOS FAVORITOS */}
              <div className="section-card mb-3">
                <div className="section-header">
                  <h5>Juegos Favoritos</h5>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingInterests(true);
                      setShowAddGameModal(true);
                    }}
                    className="btn-edit"
                  >
                    Editar
                  </Button>
                </div>
                <div className="section-body">
                  {interests.length > 0 ? (
                    <ListGroup className="games-list">
                      {interests.map((game) => (
                        <ListGroup.Item key={game.id} className="game-item">
                          <div className="game-info">
                            <img
                              src={game.thumbnail}
                              alt={game.title}
                              className="game-thumb"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80/2c3e50/ffffff?text=Game'; }}
                            />
                            <div>
                              <strong className="game-title">{game.title}</strong>
                              <small className="game-desc">{game.short_description}</small>
                            </div>
                          </div>
                          {editingInterests && (
                            <Button
                              variant="link"
                              size="sm"
                              className="btn-remove"
                              onClick={() => handleRemoveInterest(game.id)}
                            >
                              ×
                            </Button>
                          )}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <p className="text-muted small">No hay juegos favoritos aún</p>
                  )}
                </div>
              </div>

              {/* ESTADÍSTICAS */}
              <div className="section-card mb-5">
                <div className="section-header">
                  <h5>Estadísticas</h5>
                </div>
                <div className="section-body">
                  <p><strong>Equipo:</strong> {informacionUsuario?.teamName || 'Sin equipo'}</p>
                  <p><strong>Victorias:</strong> {informacionUsuario?.victorias || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bottom-spacer"></div>
      </div>

      {/* Modal: Editar datos personales */}
      <Modal show={editingPersonal} onHide={() => setEditingPersonal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Datos personales</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Correo:</Form.Label>
              <Form.Control
                type="email"
                value={personalData.email}
                onChange={(e) => {
                  const newEmail = e.target.value;
                  setPersonalData({ ...personalData, email: newEmail });
                  validateEmail(newEmail);
                }}
                placeholder="ejemplo@correo.com"
                isInvalid={!personalValidation.emailValid}
                isValid={personalValidation.emailValid && personalData.email.trim() !== ''}
              />
              <Form.Control.Feedback type={personalValidation.emailValid ? 'valid' : 'invalid'}>
                {personalValidation.emailMessage}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de usuario:</Form.Label>
              <Form.Control
                value={personalData.username}
                onChange={(e) => {
                  const newUsername = e.target.value;
                  setPersonalData({ ...personalData, username: newUsername });
                  validateUsername(newUsername);
                }}
                placeholder="Tu nombre de usuario"
                isInvalid={!personalValidation.usernameValid}
                isValid={personalValidation.usernameValid && personalData.username.trim() !== ''}
              />
              <Form.Control.Feedback type={personalValidation.usernameValid ? 'valid' : 'invalid'}>
                {personalValidation.usernameMessage}
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setEditingPersonal(false)}>
            Cancelar
          </Button>
          <Button style={{ backgroundColor: '#4A3287', border: 'none' }} onClick={handleSavePersonal}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Agregar juego favorito */}
      <Modal
        show={showAddGameModal}
        onHide={() => {
          setShowAddGameModal(false);
          setEditingInterests(false);
          setNewGameName('');
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Agregar juego favorito</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Escribe el nombre del videojuego</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: League of Legends, Minecraft, GTA V..."
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                autoFocus
              />
            </Form.Group>

            <Button
              variant="success"
              onClick={handleAddInterest}
              disabled={!newGameName.trim()}
              className="me-2"
            >
              + Agregar "{newGameName || 'juego'}"
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="danger"
            onClick={() => {
              setShowAddGameModal(false);
              setEditingInterests(false);
              setNewGameName('');
            }}
          >
            Cancelar
          </Button>
          <Button
            style={{ backgroundColor: '#4A3287', border: 'none' }}
            onClick={handleSaveInterests}
          >
            Guardar lista
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Editar contraseña */}
      <Modal show={editingPassword} onHide={() => setEditingPassword(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar contraseña</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3 position-relative">
              <Form.Label>Contraseña actual:</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => handlePasswordChange('old', e.target.value)}
                  placeholder="Escribe tu contraseña actual"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute"
                  style={{
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    padding: '0',
                    color: '#6c757d'
                  }}
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  aria-label="Mostrar contraseña"
                >
                  <i className={`bi ${showOldPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3 position-relative">
              <Form.Label>Nueva contraseña:</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => handlePasswordChange('new', e.target.value)}
                  placeholder="Escribe la nueva contraseña"
                  className={`${newPassword && passwordValidation.isValid ? 'is-valid' :
                      newPassword && !passwordValidation.isValid ? 'is-invalid' : ''
                    }`}
                  style={{
                    paddingRight: newPassword && passwordValidation.isValid ? '95px' : '40px'
                  }}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute"
                  style={{
                    right: newPassword && passwordValidation.isValid ? '65px' : '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    padding: '0',
                    color: '#6c757d',
                    zIndex: 10
                  }}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label="Mostrar contraseña"
                >
                  <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>

              {newPassword && (
                <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                  <small className="text-muted d-block mb-1">Requisitos de contraseña:</small>
                  <div className="d-flex flex-wrap gap-1">
                    <small className={`badge ${passwordValidation.length ? 'bg-success' : 'bg-secondary'}`}>
                      <i className={`bi ${passwordValidation.length ? 'bi-check' : 'bi-x'} me-1`}></i>
                      8+ caracteres
                    </small>
                    <small className={`badge ${passwordValidation.uppercase ? 'bg-success' : 'bg-secondary'}`}>
                      <i className={`bi ${passwordValidation.uppercase ? 'bi-check' : 'bi-x'} me-1`}></i>
                      Mayúscula
                    </small>
                    <small className={`badge ${passwordValidation.number ? 'bg-success' : 'bg-secondary'}`}>
                      <i className={`bi ${passwordValidation.number ? 'bi-check' : 'bi-x'} me-1`}></i>
                      Número
                    </small>
                    <small className={`badge ${passwordValidation.special ? 'bg-success' : 'bg-secondary'}`}>
                      <i className={`bi ${passwordValidation.special ? 'bi-check' : 'bi-x'} me-1`}></i>
                      Carácter especial
                    </small>
                  </div>
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3 position-relative">
              <Form.Label>Confirmar nueva contraseña:</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                  placeholder="Confirma la nueva contraseña"
                  className={`${confirmPasswordValidation.hasValue && !confirmPasswordValidation.matches ? 'is-invalid' : ''
                    }`}
                  style={{
                    paddingRight: confirmPasswordValidation.matches ? '95px' : '40px'
                  }}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute"
                  style={{
                    right: confirmPasswordValidation.matches ? '65px' : '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    padding: '0',
                    color: '#6c757d',
                    zIndex: 10
                  }}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Mostrar contraseña"
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>

              {confirmPasswordValidation.hasValue && (
                <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                  <div className="d-flex align-items-center">
                    <small className={`badge ${confirmPasswordValidation.matches ? 'bg-success' : 'bg-danger'}`}>
                      <i className={`bi ${confirmPasswordValidation.matches ? 'bi-check' : 'bi-x'} me-1`}></i>
                      {confirmPasswordValidation.matches ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                    </small>
                  </div>
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="danger" onClick={() => {
            setEditingPassword(false);
            setOldPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setShowOldPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setPasswordValidation({ length: false, uppercase: false, number: false, special: false, isValid: false });
            setConfirmPasswordValidation({ matches: false, hasValue: false });
          }}>
            Cancelar
          </Button>
          <Button
            style={{ backgroundColor: "#4A3287", border: "none" }}
            onClick={handleSavePassword}
          >
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}