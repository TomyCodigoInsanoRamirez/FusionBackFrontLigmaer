import React from 'react';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { useState, useEffect } from 'react';
import {getRadarChartData} from './../utils/Service/usuario';
import {searchUserByEmail} from "./../utils/Service/General";


export default function RadarChartGamers() {
  // const dataset = [
  //   { metric: 'Kills', alpha: 90, beta: 70, gamma: 50 },
  //   { metric: 'Deaths', alpha: 20, beta: 40, gamma: 60 },
  //   { metric: 'Assists', alpha: 60, beta: 50, gamma: 70 },
  // ];

  const [chartData, setChartData] = useState([]);
  const [victorias, setVictorias] = useState([]);
  const [derrotas, setDerrotas] = useState([]);
  const [nombres, setNombres] = useState([]);
  const [maxValue, setMaxValue] = useState(0);

  const [id, setId] = useState(null);
  
     // Obtener correo del token
      const getCorreoFromToken = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
    
        try {
          const payloadBase64 = token.split(".")[1];
          const payloadJson = atob(payloadBase64);
          const payload = JSON.parse(payloadJson);
          return payload.sub || null;
        } catch (error) {
          console.error("Token inválido:", error);
          return null;
        }
      };
    
      // Cargar información del usuario al montar el componente
      useEffect(() => {
        const email = getCorreoFromToken();
        if (email) {
          searchUserByEmail(email)
            .then((data) => {
              setId(data.teamId);       
              console.log("ID usuario en LineChartGamers:", data.teamId); 
            })
            .catch((err) => console.error("Error al cargar usuario:", err));
        }
      }, []);

useEffect(() => {   
  getRadarChartData(id)
    .then((data) => {
      setChartData(data.data.players);
      console.log("Data radar chart:", data.data.players);
    })
    .catch((err) => console.log(err));
}, []);

useEffect(() => {
  if (chartData.length === 0) return;
  setVictorias(chartData.map(i => i.victorias));
  setDerrotas(chartData.map(i => i.derrotas));
  setNombres(chartData.map(i => i.nombre));

  setMaxValue(Math.max(...victorias, ...derrotas));

}, [chartData]);

    
  return (
    <div className="chart-container" style={{ color: '#fff' }}>
      {/* <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
        Aporte individual
      </h3> */}
      <RadarChart
        height={300}
        series={[{ label: 'Victorias', data: victorias },{ label: 'Derrotas', data: derrotas }]}
        radar={{
            max: maxValue + 1,
            metrics: nombres,
        }}
        />
    </div>
  );
}