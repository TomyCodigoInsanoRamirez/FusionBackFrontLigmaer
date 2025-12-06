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
// Endpoint: /api/tournaments/{tournamentId}/join-requests (solicitar unir equipo)
//--------------------------------------------
export async function requestJoinTournament(tournamentId, teamId){
  try {
    const response = await api.post(`/api/tournaments/${tournamentId}/join-requests`, { teamId });
    return response.data;
  } catch (error) {
    console.error("Error solicitando unirse al torneo:", error);
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
// Endpoints: /api/tournaments/{id}/join-requests (organizador)
//--------------------------------------------
export async function getTournamentJoinRequests(tournamentId){
  try {
    const response = await api.get(`/api/tournaments/${tournamentId}/join-requests`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo solicitudes del torneo:", error);
    throw error;
  }
}

export async function respondTournamentJoinRequest(tournamentId, requestId, status){
  try {
    const response = await api.put(`/api/tournaments/${tournamentId}/join-requests/${requestId}`, { status });
    return response.data;
  } catch (error) {
    console.error("Error respondiendo solicitud del torneo:", error);
    throw error;
  }
}
//--------------------------------------------
// Endpoint: /api/teams para crear equipos (usa multipart por archivo opcional)
//--------------------------------------------
export async function createTeam(teamData){
  // Acepta tanto un objeto plano como un FormData. Si es objeto, se transforma a FormData.
  const payload = teamData instanceof FormData ? teamData : (() => {
    const fd = new FormData();
    fd.append('name', teamData.name ?? '');
    fd.append('description', teamData.description ?? '');
    if (teamData.image) fd.append('image', teamData.image);
    // Soporte legacy: si viene "logo" (del input file) también se mapea a image
    if (!teamData.image && teamData.logo) fd.append('image', teamData.logo);
    // Logo por defecto cuando no hay archivo
    if (!teamData.image && !teamData.logo && teamData.logoUrl) {
      fd.append('logoUrl', teamData.logoUrl);
    }
    return fd;
  })();

  try {
    const response = await api.post("/api/teams", payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
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