// General.jsx
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

// -----------------------------------------
// Endpoint: /api/profile
// -----------------------------------------
export async function getProfile() {
  try {
    const response = await api.get("/api/profile");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo el perfil:", error);
    throw error;
  }
}
//--------------------------------------------
//Endpoitn: /api/auth/register
//--------------------------------------------
export async function registerUser(userData){
  try {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Error registrando el usuario:", error);
    throw error;
  }
}
//--------------------------------------------
// Endopint: /api/auth/forgot-password
//--------------------------------------------
export async function resetPassword(email){
  try {
    const response = await api.post("/api/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    console.error("Error reseteando la contraseña:", error);
    throw error;
  }
}
//---------------------------------------------
//Endopint: /api/profile/change-password
//---------------------------------------------
export async function changePassword(data){
  try {
    const response = await api.put("/api/profile/change-password", data);
    return response.data;
  } catch (error) {
    console.error("Error cambiando la contraseña:", error);
    throw error;
  }
}
//--------------------------------------------
//Endopoint: /api/admin/users
//--------------------------------------------
export async function getAllUsers(){
  try {
    const response = await api.get("/api/admin/users");
    console.log("Usuarios obtenidos:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo los usuarios:", error);
    throw error;
  }
}
//--------------------------------------------
// Endopoint: /api/tournaments
//--------------------------------------------
export async function getAllTournaments(){ //
  try {
    const response = await api.get("/api/tournaments/summary");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo los torneos:", error);
    throw error;
  }
}

//--------------------------------------------
// Endopoint: /api/tournaments/my-tournaments
//--------------------------------------------
export async function getAllMyTournaments(){ 
  try {
    const response = await api.get("/api/tournaments/my-tournaments");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo los torneos:", error);
    throw error;
  }
}
//--------------------------------------------
// Endpoint: /api/teams para crear equipos
//--------------------------------------------
export async function createTeam(teamData){
  try {
    const response = await api.post("/api/teams", teamData);
    console.log("Equipo creado:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creando el equipo:", error);
    throw error;
  }
}

//--------------------------------------------
// Endpoint: /api/admin/users/search?email=
//--------------------------------------------
export async function searchUserByEmail(email){   
  console.log("Buscando usuario por email:", email);
  try {
    const response = await api.get(`/api/admin/users/search?email=${encodeURIComponent(email)}`);
    console.log("Usuario encontrado:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error buscando el usuario por email:", error);
    throw error;
  } 
}
//------------------------------------------
// Endpoint: /api/admin/users/:userId
// -----------------------------------------
export async function activeUser(userId){
    try {
        const response = await api.put(`/api/admin/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error activando el usuario:", error);
        throw error;
  }
}
//------------------------------------------
// Endpoint: /api/admin/users/search?email= (para obtener usuario por email)
// -----------------------------------------
export async function getUserByEmail(email){
    try {
        const response = await api.get(`/api/admin/users/search?email=${email}`);
        return response.data;
    } catch (error) {
        console.error("Error obteniendo usuario por email:", error);
        throw error;
    }
}