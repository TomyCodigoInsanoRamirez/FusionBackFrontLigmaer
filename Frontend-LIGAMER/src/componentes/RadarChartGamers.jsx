import React, { useEffect, useMemo, useState } from 'react';
import {
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getRadarChartData } from './../utils/Service/usuario';

export default function RadarChartGamers() {
  const { user } = useAuth();
  const teamId = user?.teamId || user?.ownedTeam?.id || 0;

  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (teamId === null || teamId === undefined) return;

    getRadarChartData(teamId)
      .then((data) => {
        const list = data?.data?.players;
        setPlayers(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('Error obteniendo radar chart:', err);
        setPlayers([]);
      });
  }, [teamId]);

  const chartRows = useMemo(() => {
    if (!players.length) return [];
    return players.map((p, idx) => ({
      metric: p.nombre || `Jugador ${idx + 1}`,
      victorias: p.victorias || 0,
      derrotas: p.derrotas || 0,
    }));
  }, [players]);

  const maxValue = useMemo(() => {
    if (!chartRows.length) return 1;
    return Math.max(1, ...chartRows.map((r) => Math.max(r.victorias, r.derrotas)));
  }, [chartRows]);

  if (!chartRows.length) {
    return <div className="text-muted">Sin datos de victorias/derrotas por jugador.</div>;
  }

  return (
    <div className="chart-container" style={{ color: '#fff' }}>
      <ResponsiveContainer width="100%" height={300}>
        <ReRadarChart data={chartRows} outerRadius="70%">
          <PolarGrid stroke="#445" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: '#fff', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, maxValue + 1]} tick={{ fill: '#ccc', fontSize: 11 }} />
          <Radar
            name="Victorias"
            dataKey="victorias"
            stroke="#4ade80"
            fill="#4ade80"
            fillOpacity={0.4}
          />
          <Radar
            name="Derrotas"
            dataKey="derrotas"
            stroke="#f87171"
            fill="#f87171"
            fillOpacity={0.35}
          />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1f2937' }} />
          <Legend wrapperStyle={{ color: '#fff' }} />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}