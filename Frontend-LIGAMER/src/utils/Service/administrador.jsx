// administrador.jsx
import axios from "axios";
import getBaseUrl from "./BaseUrl";

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// -----------------------------------------
// Interceptor para meter el Bearer Token
// -----------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // o sessionStorage, o donde lo guardes

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

//-----------------------------------------
// Endpoint: /api/admin/users/:userId/assign-organizer
//-----------------------------------------
export async function assignOrganizerRole(userId, assign = true) {
  try {
    const response = await api.put(`/api/admin/users/${userId}/assign-organizer`, {
      assign: assign
    });
    console.log("Rol de organizador asignado:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error asignando rol de organizador:", error);
    throw error;
  }
}

