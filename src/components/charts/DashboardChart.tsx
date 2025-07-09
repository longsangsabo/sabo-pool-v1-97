import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  previous: number;
}

interface DashboardChartProps {
  data: ChartData[];
  title: string;
  color?: string;
}

const DashboardChart: React.FC<DashboardChartProps> = ({ 
  data, 
  title, 
  color = 'hsl(var(--primary))' 
}) => {
  return (
    <div className="h-80">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            className="text-sm text-muted-foreground"
          />
          <YAxis className="text-sm text-muted-foreground" />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            fill={color}
            fillOpacity={0.3}
          />
          <Area 
            type="monotone" 
            dataKey="previous" 
            stroke="hsl(var(--muted-foreground))"
            fill="hsl(var(--muted-foreground))"
            fillOpacity={0.1}
            strokeDasharray="5 5"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardChart;