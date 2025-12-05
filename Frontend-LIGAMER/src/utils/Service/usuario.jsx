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
// Endpoint: /api/teams
// -----------------------------------------

export async function getAllTeams() {
    try{
        const response = await api.get("/api/teams");
        return response.data;
    } catch (error) {
        console.error("Error obteniendo los torneos:", error);
        throw error;
    }
}

// -----------------------------------------
// Endpoint: /api/teams/:teamId/join-requests
// -----------------------------------------
export async function requestToJoinTeam(teamId) {
    try {
        const response = await api.post(`/api/teams/${teamId}/join-requests`);
        return response.data;
    } catch (error) {
        console.error("Error solicitando unirse al equipo:", error);
        throw error;
    }
}
// -----------------------------------------
// Endpoint: /api/teams/:teamId/join-requests
// -----------------------------------------
export async function requestToTeams(teamId) {
    try {
        const response = await api.get(`/api/teams/${teamId}/join-requests`);
        return response.data;
    } catch (error) {
        console.error("Error solicitando unirse al equipo:", error);
        throw error;
    }
}

// -----------------------------------------
// Endpoint: /api/teams/:teamId/members
//------------------------------------------
export async function getTeamMembers(teamId) {
    try {
        const response = await api.get(`/api/teams/${teamId}/members`); 
        console.log("Miembros del equipo obtenidos:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error obteniendo los miembros del equipo:", error);
        throw error;
    } 
}

// -----------------------------------------
// Endpoint: /api/stats/pie
// -----------------------------------------
export async function getPieChartData(teamId) {
    if(!teamId || teamId === null){
        teamId = 0;
    }
    console.log("TeamID en Service: "+teamId);
    try {
        const response = await api.post(`/api/stats/pie`, {
             "teamId": teamId 
        });
        return response.data;
    } catch (error) {
        console.error("Error obteniendo los datos del gráfico circular:", error);
        throw error;
    }   
}

// -----------------------------------------
// Endpoint: /api/stats/radar?teamId=&tournamentId=
// -----------------------------------------
export async function getRadarChartData(teamId) {
    if(!teamId || teamId === null){
        teamId = 0;
    }
    try {
        const response = await api.post(`/api/stats/radar`, {
             "teamId": teamId 
        });
        return response.data;       
    }
    catch (error) {
        console.error("Error obteniendo los datos del gráfico de barras:", error);
        throw error;
    }   
}

//--------------------------------------------
// Endopoint: /api/stats/series
//--------------------------------------------
export async function getLineChartData(teamId){
    if(!teamId || teamId === null){
        teamId = 0;
    }
  try {
    const response = await api.post("/api/stats/series", {
       "teamId": teamId 
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo los datos del gráfico de líneas:", error);
    throw error;
  } 
}

// -----------------------------------------
// Endpoint: /api/teams/:teamId/join-requests/:requestId - Aceptar/Rechazar solicitud
// -----------------------------------------
export async function manageJoinRequest(teamId, requestId, action) {
    try {
        const response = await api.put(`/api/teams/${teamId}/join-requests/${requestId}`, {
            action: action // "ACCEPT" o "REJECT"
        });
        console.log(`Solicitud ${action === 'ACCEPT' ? 'aceptada' : 'rechazada'}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error ${action === 'ACCEPT' ? 'aceptando' : 'rechazando'} solicitud:`, error);
        throw error;
    }
}
//-----------------------------------------
// Endpoint: /api/teams/:teamId/leave - Salir del equipo
//-----------------------------------------
export async function leaveTeam(teamId) {
    try {
      const response = await api.post(`/api/teams/${teamId}/leave`);
      return response.data;
    } catch (error) {
      console.error("Error al salir del equipo:", error);
      throw error;
    }
}
