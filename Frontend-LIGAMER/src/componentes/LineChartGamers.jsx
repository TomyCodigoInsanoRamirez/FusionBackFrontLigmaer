import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { useState, useEffect } from 'react';
import {getLineChartData} from './../utils/Service/usuario';
import { useAuth } from '../context/AuthContext';

export default function TorneosLineChart() {
  const { user } = useAuth();
  const teamId = user?.teamId || user?.ownedTeam?.id || 0;
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (teamId === null || teamId === undefined) return;

    getLineChartData(teamId)
      .then((data) => {
        setChartData(Array.isArray(data.data) ? data.data : []);
      })
      .catch((err) => {
        console.error('Error obteniendo line chart:', err);
        setChartData([]);
      });
  }, [teamId]);

  if (!chartData.length) {
    return <div className="text-muted">Sin historial de torneos para este equipo.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
        {/* Línea principal: total de encuentros */}
        <Line
          type="monotone"
          dataKey="encuentros"
          stroke="#1976d2"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Encuentros totales"
        />

        {/* Línea de encuentros ganados */}
        <Line
          type="monotone"
          dataKey="ganados"
          stroke="#00c853"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Encuentros ganados"
        />

        {/* Línea de encuentros perdidos */}
        <Line
          type="monotone"
          dataKey="perdidos"
          stroke="#d50000"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Encuentros perdidos"
        />
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="torneo" angle={-20} textAnchor="end" tickMargin={10} />
        <YAxis label={{ value: 'Encuentros', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        {/* <Legend /> */}
        
      </LineChart>
    </ResponsiveContainer>
  );
}
