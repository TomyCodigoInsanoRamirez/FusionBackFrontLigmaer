import React, { useEffect, useMemo, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from '../context/AuthContext';
import { getPieChartData } from './../utils/Service/usuario';

export default function PieChartGamers() {
  const { user } = useAuth();
  const teamId = user?.teamId || user?.ownedTeam?.id || 0;

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (teamId === null || teamId === undefined) return;

    getPieChartData(teamId)
      .then((data) => {
        // Esperamos un arreglo de { id, value, label, color }
        setChartData(Array.isArray(data.data) ? data.data : []);
      })
      .catch((err) => {
        console.error('Error obteniendo pie chart:', err);
        setChartData([]);
      });
  }, [teamId]);

  const chartDataPercent = useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return [];
    const total = chartData.reduce((sum, item) => sum + (item.value || 0), 0);
    return chartData.map((item) => {
      const value = item.value || 0;
      const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
      return { ...item, value: percentage };
    });
  }, [chartData]);

  if (!chartDataPercent.length) {
    return <div className="text-muted">Sin datos de victorias/derrotas para tu equipo.</div>;
  }

  return (
    <div className="chart-container">
      <PieChart
        series={[
          {
            data: chartDataPercent,
            innerRadius: 50,
            outerRadius: 120,
            paddingAngle: 3,
            cornerRadius: 5,
            arcLabel: (item) => `${item.formattedValue}%`,
            arcLabelMinAngle: 15,
          },
        ]}
        width={400}
        height={300}
        slotProps={{
          legend: { hidden: false, position: { vertical: 'bottom', horizontal: 'middle' } },
        }}
      />
    </div>
  );
}