import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "bootstrap-icons/font/bootstrap-icons.css"; 
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { activeUser, getUserByEmail } from '../utils/Service/General';

const MySwal = withReactContent(Swal);

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(() => {
    const stored = localStorage.getItem(`failedAttempts_${username}`);
    return stored ? parseInt(stored) : 0;
  });
  const [isUserDisabled, setIsUserDisabled] = useState(() => {
    const stored = localStorage.getItem(`userDisabled_${username}`);
    return stored === 'true';
  });
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;
  const hasRedirected = useRef(false);

  const { user, login, loading } = useAuth();

  useEffect(() => {
    // Si el usuario ya está autenticado y llega a /login (por ejemplo con el botón "atrás"),
    // redirigirlo automáticamente a su inicio según el rol.
    if(loading) return; // Esperar a que se cargue el estado de autenticación
    if (!user || hasRedirected.current) return;
    
    hasRedirected.current = true;
    const roleMap = {
      'ROLE_JUGADOR': '/user',
      'ROLE_ORGANIZADOR': '/manager',
      'ROLE_ADMINISTRADOR': '/admin'
    };
    const targetRoute = roleMap[user.role] || '/';
    navigate(targetRoute, { replace: true });
  }, [loading, user]);

  // Efecto para cargar los intentos fallidos cuando cambia el username
  useEffect(() => {
    if (username) {
      const storedAttempts = localStorage.getItem(`failedAttempts_${username}`);
      const storedDisabled = localStorage.getItem(`userDisabled_${username}`);
      
      setFailedAttempts(storedAttempts ? parseInt(storedAttempts) : 0);
      setIsUserDisabled(storedDisabled === 'true');
    } else {
      setFailedAttempts(0);
      setIsUserDisabled(false);
    }
  }, [username]);
  
  if (loading) return null; // o un spinner

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Verificar si el usuario está deshabilitado
    if (isUserDisabled) {
      MySwal.fire({
        icon: "error",
        title: "Usuario deshabilitado",
        text: "Tu cuenta ha sido deshabilitada por múltiples intentos fallidos. Contacta al administrador.",
        confirmButtonText: "Aceptar"
      });
      return;
    }

    try {
      const u = await login(username, password);
      // Resetear intentos fallidos si el login es exitoso
      setFailedAttempts(0);
      setIsUserDisabled(false);
      localStorage.removeItem(`failedAttempts_${username}`);
      localStorage.removeItem(`userDisabled_${username}`);
      
      // Si veníamos de una ruta protegida, volver ahí, si no, navegar según rol
      if (from) {
        navigate(from, { replace: true });
        return;
      }
      if (u.role === 'ROLE_ADMINISTRADOR' || u.role === 'admin') navigate('/admin');
      else if (u.role === 'ROLE_ORGANIZADOR' || u.role === 'manager') navigate('/manager');
      else navigate('/user');
    } catch (err) {
      // Incrementar contador de intentos fallidos
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      localStorage.setItem(`failedAttempts_${username}`, newFailedAttempts.toString());

      if (newFailedAttempts >= 3) {
        // Deshabilitar usuario después de 3 intentos
        try {
          // Obtener información del usuario por email para conseguir su ID
          const userInfo = await getUserByEmail(username);
          
          if (userInfo && userInfo.data && userInfo.data.id) {
            // Llamar al endpoint activeUser para deshabilitar (cambiar estado a false)
            await activeUser(userInfo.data.id);
            setIsUserDisabled(true);
            localStorage.setItem(`userDisabled_${username}`, 'true');
            
            MySwal.fire({
              icon: "error",
              title: "Usuario deshabilitado",
              text: "Has excedido el número máximo de intentos permitidos (3). Tu cuenta ha sido deshabilitada. Contacta al administrador.",
              confirmButtonText: "Aceptar"
            });
          } else {
            // Si no podemos obtener el usuario, solo mostramos el mensaje local
            setIsUserDisabled(true);
            localStorage.setItem(`userDisabled_${username}`, 'true');
            MySwal.fire({
              icon: "error",
              title: "Usuario deshabilitado",
              text: "Has excedido el número máximo de intentos permitidos (3). Tu cuenta ha sido deshabilitada temporalmente.",
              confirmButtonText: "Aceptar"
            });
          }
        } catch (disableError) {
          console.error("Error al deshabilitar usuario:", disableError);
          // Incluso si falla la deshabilitación en el servidor, deshabilitar localmente
          setIsUserDisabled(true);
          localStorage.setItem(`userDisabled_${username}`, 'true');
          MySwal.fire({
            icon: "error",
            title: "Usuario deshabilitado",
            text: "Has excedido el número máximo de intentos permitidos (3). Tu cuenta ha sido deshabilitada temporalmente.",
            confirmButtonText: "Aceptar"
          });
        }
      } else {
        const remainingAttempts = 3 - newFailedAttempts;
        MySwal.fire({
          icon: "warning",
          title: "Credenciales incorrectas",
          text: `Las credenciales que ingresaste no son válidas. Te quedan ${remainingAttempts} intento(s).`,
          confirmButtonText: "Aceptar"
        });
      }
      
      // Mantener texto de error opcionalmente para la UI
      setError(err?.message || "Credenciales incorrectas");
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="row w-100 justify-content-center">
        {/* Left: formulario (siempre visible) */}
        <div className="col-11 col-sm-10 col-md-8 col-lg-6">
          <div className="d-flex flex-column flex-md-row shadow" style={{ minHeight: '60vh', borderRadius: 20, overflow: 'hidden' }}>
            <div className="p-4" style={{ backgroundColor: '#002733', color: 'white', flex: 1, display: 'grid', alignContent: 'center' }}>
              <div style={{ maxWidth: 520, margin: '0 auto' }}>
                <div className="text-center mb-3">
                  <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Inicio de sesión</h1>
                  <img src="src/assets/imagenes/Logo.png" width={100} height={90} alt="Logo del sistema LIGAMER" />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3 text-start">
                    <label className="form-label">Nombre de usuario:</label>
                    <input
                      type="text"
                      placeholder="Introduce tu nombre de usuario"
                      className="form-control"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="mb-3 text-start position-relative">
                    <label className="form-label">Contraseña:</label>

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Introduce tu contraseña"
                      className="form-control"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />

                    {/* Botón del ojo */}
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Mostrar contraseña"
                      style={{ right: 10 }}  
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>

                    <div className="mt-2"><Link className="text-light" to="/reset-password">¿Olvidaste tu contraseña?</Link></div>
                  </div>

                  {error && <div className="text-danger mb-2">{error}</div>}

                  {isUserDisabled && (
                    <div className="alert alert-danger mb-3" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      Usuario deshabilitado por múltiples intentos fallidos.
                    </div>
                  )}

                  {failedAttempts > 0 && failedAttempts < 3 && !isUserDisabled && (
                    <div className="alert alert-warning mb-3" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Intentos fallidos: {failedAttempts}/3. Te quedan {3 - failedAttempts} intento(s).
                    </div>
                  )}

                  <div className="d-grid gap-2 mb-3">
                    <button 
                      type="submit" 
                      className="btn" 
                      style={{ backgroundColor: '#4A3287', color: 'white' }}
                      disabled={isUserDisabled}
                    >
                      {isUserDisabled ? 'Usuario deshabilitado' : 'Iniciar sesión'}
                    </button>
                  </div>

                  <div className="d-flex justify-content-center text-center text-light">
                    <p className="mb-0 me-2">¿Aun no tienes cuenta?</p>
                    <Link className="text-light" to="/register">Crear cuenta</Link>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: imagen decorativa, oculta en pantallas pequeñas */}
            <div className="d-none d-md-flex align-items-center justify-content-center" style={{ backgroundColor: '#00A6A6', width: 220 }}>
              <img src="src/assets/imagenes/Control.png" alt="Decoración" style={{ maxWidth: '50%', height: 'auto' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
