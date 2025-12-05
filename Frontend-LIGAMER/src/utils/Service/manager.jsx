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
// Endpoint: /api/tournaments/{tournametId}
// -----------------------------------------

export async function getTournamentById(id){
  try {
    const response = await api.get(`/api/tournaments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo el torneo por ID:", error);
    throw error;
  }
}

//--------------------------------------------
//Endpoitn: /api/tournaments
//--------------------------------------------
export async function saveTournament(torneGuardar){
  try {
    const response = await api.post("/api/tournaments",torneGuardar);
    return response.data;
  } catch (error) {
    console.error("Error guardando el torneo:", error);
    throw error;
  } 
}

//--------------------------------------------
//Endpoitn: /api/tournaments/:tournamentId
//--------------------------------------------
export async function updateTournament(tournamentId, datosActualizados) {
  console.log("Datos a actualizar en el servicio:", datosActualizados);
  try {
    const response = await api.put(
      `/api/tournaments/${tournamentId}`,
      datosActualizados
    );
    return response.data;
  } catch (error) {
    console.error("Error actualizando torneo:", error);
    throw error; // importante para que el catch del componente lo reciba
  }
}