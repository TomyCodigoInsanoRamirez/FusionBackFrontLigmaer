import React, { createContext, useContext, useState, useEffect } from 'react';
import API from './../utils/api';
import { getProfile } from '../utils/Service/General';

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

// Función para decodificar el JWT y extraer el payload
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    
    // Decodificar el token para extraer la información del usuario
    API.setToken(token);
    const payload = decodeJWT(token);
    
    if (payload && payload.sub) {
      // El JWT contiene el email en 'sub' y los roles en 'authorities'
      const email = payload.sub;
      const authorities = payload.authorities || [];
      // Extraer el rol principal (ROLE_USUARIO, ROLE_ORGANIZADOR, ROLE_ADMINISTRADOR)
      const role = authorities[0] || 'ROLE_USUARIO';
      
      // Obtener el perfil completo del usuario (incluyendo teamId)
      getProfile()
        .then((profileResponse) => {
          const profile = profileResponse.data;
          const teamId = profile.team?.id || profile.ownedTeam?.id;
          setUser({ 
            email, 
            role,
            id: profile.id,
            nombre: profile.nombre,
            teamId: teamId,
            team: profile.team,
            ownedTeam: profile.ownedTeam
          });
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error obteniendo perfil:', err);
          // Si falla, usar solo los datos del JWT
          setUser({ email, role });
          setLoading(false);
        });
    } else {
      // Token inválido
      console.error('Invalid token payload');
      API.logout();
      setUser(null);
      localStorage.removeItem('token');
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    // Llamada real al backend
    const res = await API.login(email, password); // { accessToken }
    console.log('Login response:', res);
    
    const token = res.accessToken || res.token || res;
    if (!token) throw new Error('No se recibió token del servidor');
    
    // Decodificar el JWT para obtener la información del usuario
    const payload = decodeJWT(token);
    if (!payload || !payload.sub) {
      throw new Error('Token inválido recibido del servidor');
    }
    
    API.setToken(token);
    localStorage.setItem("token", token);

    // Extraer información del JWT
    const userEmail = payload.sub;
    const authorities = payload.authorities || [];
    const userRole = authorities[0] || 'ROLE_USUARIO';
    
    // Obtener el perfil completo del usuario
    try {
      const profileResponse = await getProfile();
      const profile = profileResponse.data;
      const teamId = profile.team?.id || profile.ownedTeam?.id;
      
      const userObj = { 
        email: userEmail, 
        role: userRole,
        id: profile.id,
        nombre: profile.nombre,
        teamId: teamId,
        team: profile.team,
        ownedTeam: profile.ownedTeam
      };
      setUser(userObj);
      return userObj;
    } catch (err) {
      console.error('Error obteniendo perfil completo:', err);
      // Si falla, usar solo los datos del JWT
      const userObj = { email: userEmail, role: userRole };
      setUser(userObj);
      return userObj;
    }
  };

  const logout = () => {
    API.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
