import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CrearCuenta.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { registerUser } from '../utils/Service/General';
import { appBarClasses } from '@mui/material';


const MySwal = withReactContent(Swal);

export default function CrearCuenta() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailValidation, setEmailValidation] = useState({ checking: false, exists: null, message: '' });
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
  const [form, setForm] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    username: '',
    email: '',
    password: '',
    confirm: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    
    // Si el campo es password, validar requisitos
    if (e.target.name === 'password') {
      validatePassword(e.target.value);
      // También validar confirmación si ya tiene valor
      if (form.confirm) {
        validateConfirmPassword(e.target.value, form.confirm);
      }
    }
    
    // Si el campo es confirm, validar que coincida con password
    if (e.target.name === 'confirm') {
      validateConfirmPassword(form.password, e.target.value);
    }
  };

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

  const generateRandomUsername = () => {
    const adjectives = [
      'Gamer', 'Pro', 'Epic', 'Legend', 'Master', 'Elite', 'Cyber', 'Dark', 'Fire', 'Ice',
      'Thunder', 'Shadow', 'Neon', 'Turbo', 'Mega', 'Ultra', 'Super', 'Alpha', 'Beta', 'Omega'
    ];
    
    const nouns = [
      'Player', 'Warrior', 'Hunter', 'Knight', 'Mage', 'Ninja', 'Dragon', 'Phoenix', 'Wolf', 'Eagle',
      'Titan', 'Ghost', 'Viper', 'Storm', 'Blaze', 'Frost', 'Thunder', 'Lightning', 'Comet', 'Star'
    ];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 9999) + 1;
    
    return `${randomAdjective}${randomNoun}${randomNumber}`;
  };

  const validateEmail = async (email) => {
    try {
      setEmailValidation({ checking: true, exists: null, message: 'Verificando correo...' });
      
      const response = await checkEmailExists(email);
      
      if (response.exists) {
        setEmailValidation({ 
          checking: false, 
          exists: true, 
          message: 'Este correo ya está registrado' 
        });
      } else {
        setEmailValidation({ 
          checking: false, 
          exists: false, 
          message: 'Correo disponible' 
        });
      }
    } catch (error) {
      console.error('Error validando correo:', error);
      setEmailValidation({ 
        checking: false, 
        exists: null, 
        message: 'Error al verificar el correo' 
      });
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

 
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return MySwal.fire({
        icon: 'error',
        title: 'Correo inválido',
        text: 'Por favor, ingresa un correo electrónico válido.',
        confirmButtonColor: '#4A3287',
      });
    }

    // Validar requisitos de contraseña
    if (!passwordValidation.isValid) {
      return MySwal.fire({
        icon: 'error',
        title: 'Contraseña inválida',
        text: 'La contraseña debe cumplir con todos los requisitos de seguridad.',
        confirmButtonColor: '#4A3287',
      });
    }

    //Validacion de contraseñas
    if (form.password !== form.confirm) {
      return MySwal.fire({
        icon: 'error',
        title: 'Contraseñas no coinciden',
        text: 'Las contraseñas no coinciden. Porfavor, verificalas.',
        confirmButtonColor: '#4A3287',
      });
    }

    // Generar nombre de usuario automáticamente si está vacío
    let finalUsername = form.username.trim();
    if (!finalUsername) {
      finalUsername = generateRandomUsername();
      // Actualizar el formulario con el nombre generado
      setForm({ ...form, username: finalUsername });
    }

     //Confirmacion de registro
    const result = await MySwal.fire({
      title: 'Confirmar registro',
      text: '¿Deseas crear la cuenta con los datos ingresados?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4A3287',
      cancelButtonColor: '#dc3545',
      reverseButtons: true
    });

    if (!result.isConfirmed) {return;}

    //Aramar el objeto con los datos del formulario
    try{
      const userData ={
        nombre: form.nombre,
        apellidoPaterno: form.apellidoPaterno,
        apellidoMaterno: form.apellidoMaterno,
        username: finalUsername, // Usar el username final (generado o del form)
        email: form.email,
        password: form.password,
        confirmPassword: form.confirm
      };
    
    console.log('Registrando usuario:', userData);
    
    //Aqui conectamos backend
    const response = await registerUser(userData);
    console.log('Respuesta del registro:', response);

    await MySwal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      text: ' Tu cuenta ha sido creada exitosamente.',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#4A3287'
    });
    navigate('/login');
  }catch (error) {
    console.error('Error durante el registro:', error);
    
    // Verificar si es un error de correo duplicado
    const errorMessage = error.response?.data?.message || '';
    const statusCode = error.response?.status;
    
    // Si es un error 400 (Bad Request), probablemente es correo duplicado
    // O si el mensaje contiene palabras clave de duplicado
    if (statusCode === 400 || 
        (errorMessage.toLowerCase().includes('Ya hay una cuenta asociada al correo') && 
         errorMessage.toLowerCase().includes('correo')) ) {
      
      // Error específico de correo duplicado
      await MySwal.fire({
        icon: 'error',
        title: 'Correo ya registrado',
        text: 'Este correo electrónico ya está en uso. ¿Deseas iniciar sesión en su lugar?',
        confirmButtonColor: '#4A3287',
        showCancelButton: true,
        confirmButtonText: 'Ir a Login',
        cancelButtonText: 'Intentar con otro correo'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
    } else {
      // Otros errores generales
      await MySwal.fire({
        icon: 'error',
        title: 'Error en el registro',
        text: errorMessage || 'Ha ocurrido un error al crear la cuenta. Por favor, intenta nuevamente.',
        confirmButtonColor: '#4A3287'
      });
    }
  }
};

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="row w-100 justify-content-center">
        <div className="col-11 col-sm-10 col-md-8 col-lg-6">
          <div className="d-flex flex-column flex-md-row shadow register-card" style={{ minHeight: '60vh', borderRadius: 20, overflow: 'hidden' }}>
            <div className="p-4 register-left" style={{ flex: 1, display: 'grid', alignContent: 'center' }}>
              <div style={{ maxWidth: 520, margin: '0 auto' }}>
                <h1 style={{ fontSize: '1.8rem', marginBottom: 8, color: 'white' }}>Crear una cuenta</h1>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label text-light">Nombres:</label>
                    <input name="nombre" value={form.nombre} onChange={handleChange} className="form-control" placeholder="Ingresa tu(s) nombre(s)" />
                  </div>

                  <div className="mb-3 d-flex gap-2">
                    <div className="flex-fill">
                      <label className="form-label text-light">Apellidos:</label>
                      <input name="apellidoPaterno" value={form.apellidoPaterno} onChange={handleChange} className="form-control" placeholder="Paterno" />
                    </div>
                    <div className="flex-fill">
                      <label className="form-label text-light">&nbsp;</label>
                      <input name="apellidoMaterno" value={form.apellidoMaterno} onChange={handleChange} className="form-control" placeholder="Materno" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-light">Nombre de usuario:</label>
                    <input 
                      name="username" 
                      value={form.username} 
                      onChange={handleChange} 
                      className="form-control" 
                      placeholder="Déjalo vacío para generar uno automáticamente" 
                    />
                    <small className="text-light opacity-75 mt-1 d-block">
                      <i className="bi bi-info-circle me-1"></i>
                      Si no ingresas un nombre, se generará uno automáticamente
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-light">Correo electrónico:</label>
                    <input 
                      name="email" 
                      type="email" 
                      value={form.email} 
                      onChange={handleChange} 
                      className="form-control" 
                      placeholder="ejemplo@correo.com" 
                      required
                    />
                  </div>

                  <div className="mb-3 position-relative">
                    <label className="form-label text-light">Contraseña:</label>
                    <input 
                      name="password" 
                      value={form.password} 
                      onChange={handleChange} 
                      type={showPassword ? 'text' : 'password'} 
                      className={`form-control ${
                        form.password && passwordValidation.isValid ? 'is-valid' : 
                        form.password && !passwordValidation.isValid ? 'is-invalid' : ''
                      }`}
                      placeholder="Ingresa una contraseña segura"
                      style={{
                        paddingRight: form.password && passwordValidation.isValid ? '70px' : '40px'
                      }}
                    />
                    <button 
                      type="button" 
                      className="eye-btn" 
                      onClick={() => setShowPassword(!showPassword)} 
                      aria-label="Mostrar contraseña"
                      style={{
                        right: form.password && passwordValidation.isValid ? '40px' : '10px'
                      }}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                    
                    {/* Indicadores de requisitos de contraseña */}
                    {form.password && (
                      <div className="mt-2 p-2 rounded" style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                        <small className="text-light d-block mb-1">Requisitos de contraseña:</small>
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
                  </div>

                  <div className="mb-3 position-relative">
                    <label className="form-label text-light">Confirmar contraseña:</label>
                    <input 
                      name="confirm" 
                      value={form.confirm} 
                      onChange={handleChange} 
                      type={showConfirm ? 'text' : 'password'} 
                      className={`form-control ${
                        confirmPasswordValidation.hasValue && !confirmPasswordValidation.matches ? 'is-invalid' : ''
                      }`}
                      placeholder="Confirma tu contraseña"
                      style={{
                        paddingRight: confirmPasswordValidation.hasValue ? '70px' : '40px'
                      }}
                    />
                    <button 
                      type="button" 
                      className="eye-btn" 
                      style={{
                        color: 'black',
                        right: confirmPasswordValidation.hasValue ? '40px' : '10px'
                      }} 
                      onClick={() => setShowConfirm(!showConfirm)} 
                      aria-label="Mostrar confirmar"
                    >
                      <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                    
                    {/* Indicador de validación para confirmar contraseña */}
                    {confirmPasswordValidation.hasValue && (
                      <div className="mt-2 p-2 rounded" style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                        <div className="d-flex align-items-center">
                          <small className={`badge ${confirmPasswordValidation.matches ? 'bg-success' : 'bg-danger'}`}>
                            <i className={`bi ${confirmPasswordValidation.matches ? 'bi-check' : 'bi-x'} me-1`}></i>
                            {confirmPasswordValidation.matches ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2 mb-3">
                    <button type="button" className="btn btn-danger flex-fill" onClick={handleCancel}>Cancelar</button>
                    <button type="submit" className="btn btn-register flex-fill">Registrarse</button>
                  </div>

                  <div className="text-center text-light">
                    <small>¿Ya tienes cuenta? <Link to="/login" className="text-light">Inicia sesión</Link></small>
                  </div>
                </form>
              </div>
            </div>

            <div className="d-none d-md-flex align-items-center justify-content-center register-right">
              <img src="src/assets/imagenes/Control.png" alt="Decoración" style={{ maxWidth: '60%', height: 'auto' }} />
              <div className="version-text">V1.0.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
