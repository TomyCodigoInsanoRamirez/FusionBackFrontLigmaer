import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap-icons/font/bootstrap-icons.css";
import { resetPassword } from "../utils/Service/General";

//import "./Login.css"; // reuse styles; ajusta si necesitas otra hoja
import "./../componentes/CrearCuenta.css"; // reutilizar estilos de CrearCuenta para consistencia
const MySwal = withReactContent(Swal);

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleEnviar = async (e) => {
    e.preventDefault();

    if(!email){
      return MySwal.fire({
        icon: "error",
        title: "Correo requerido",
        text: "Por favor, ingresa tu correo electrónico.",
      });
    }

    //confirmación
    const result = await MySwal.fire({
      title: "¿Enviar enlace de restablecimiento?",
      text: `Se enviará un enlace al correo proporcionado.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#4A3287",
      cancelButtonColor: "#dc3545",
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const res = await resetPassword(email);

      console.log("Respuesta del servidor",res);

    // Simulación / feedback:
    await MySwal.fire({
      icon: "success",
      title: "Enviado",
      text: "Hemos enviado un enlace a tu correo para restablecer tu contraseña. Haz clic en él para seguir con el proceso.",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#4A3287"
    });

    navigate("/login", { replace: true });

    } catch (error) {
      console.log("Error al enviar el enlace:", error);
      await MySwal.fire({
        icon: "error",
        title: "Error",
        text: error?.reponse?.data?.message || "Ocurrió un error al intentar enviar el enlace. Por favor, intenta nuevamente más tarde.",
    });
  }
};

  const handleCancelar = (e) => {
    e.preventDefault();
    MySwal.fire({
      icon: "info",
      title: "Acción cancelada",
      text: "Se canceló el envío del enlace.",
      showConfirmButton: false,
      timer: 2000,
      // Mantener estética: botón no visible, timer automático
    });
    navigate("/login", { replace: true });
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="row w-100 justify-content-center">
        <div className="col-11 col-sm-10 col-md-8 col-lg-6">
          <div className="d-flex flex-column flex-md-row shadow" style={{ minHeight: "50vh", borderRadius: 20, overflow: "hidden" }}>
            <div className="p-4" style={{ backgroundColor: "#002733", color: "white", flex: 1, display: "grid", alignContent: "center" }}>
              <div style={{ maxWidth: 520, margin: "0 auto" }}>
                <div className="text-center mb-3">
                  <h1 style={{ fontSize: "1.8rem", marginBottom: 8 }}>Restablecer contraseña</h1>
                </div>

                <form onSubmit={handleEnviar}>
                  <div className="mb-3 text-start">
                    <label className="form-label">Correo electrónico:</label>
                    <input
                      type="email"
                      placeholder="Introduce tu correo"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="d-flex gap-2 mb-3">
                    <button
                      type="button"
                      className="btn btn-danger flex-fill"
                      onClick={handleCancelar}
                      aria-label="Cancelar envío"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn flex-fill"
                      style={{ backgroundColor: "#4A3287", color: "white" }}
                      aria-label="Enviar enlace"
                    >
                      Enviar
                    </button>
                  </div>

                  <div className="text-center text-light">
                    <small>Regresar a <Link to="/login" className="text-light">Iniciar sesión</Link></small>
                  </div>
                </form>
              </div>
            </div>

            <div className="d-none d-md-flex align-items-center justify-content-center" style={{ backgroundColor: "#00A6A6", width: 220 }}>
              <img src="src/assets/imagenes/Control.png" alt="Decoración" style={{ maxWidth: "50%", height: "auto" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
