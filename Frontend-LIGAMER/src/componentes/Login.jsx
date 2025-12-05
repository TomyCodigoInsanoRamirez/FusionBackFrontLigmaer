import React, { useState } from "react";
import "./Login.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit triggered", { email }); // debugging
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.warn("No JSON body in response", parseErr);
      }

      console.log("Login response", { status: res.status, ok: res.ok, body: data });

      // Considerar credenciales inválidas si el status es 400/401/403,
      // si res.ok es false, o si la API responde success:false / error.
      const indicaCredencialesInvalidas =
        res.status === 400 ||
        res.status === 401 ||
        res.status === 403 ||
        data?.success === false ||
        Boolean(data?.error) ||
        Boolean(data?.message && /invalid|credenci/i.test(String(data.message).toLowerCase()));

      if (indicaCredencialesInvalidas) {
        MySwal.fire({
          icon: "error",
          title: "Credenciales incorrectas",
          text: "Las credenciales que ingresaste no son válidas. Intenta de nuevo.",
          confirmButtonText: "Aceptar",
        });
        return;
      }

      // Otros errores HTTP
      if (!res.ok) {
        MySwal.fire({
          icon: "error",
          title: "Error",
          text: "No fue posible iniciar sesión. Intenta de nuevo más tarde.",
          confirmButtonText: "Aceptar",
        });
        return;
      }

      // Si llegamos aquí, se considera login exitoso
      // ...existing code: manejo de login exitoso (token, redirección, etc.)...
      console.log("Login successful", data);
    } catch (err) {
      console.error("Login request failed", err);
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "No fue posible iniciar sesión. Intenta de nuevo más tarde.",
        confirmButtonText: "Aceptar",
      });
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Iniciar sesión</h2>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary">
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}