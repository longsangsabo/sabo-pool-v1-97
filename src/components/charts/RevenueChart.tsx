import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueData {
  month: string;
  revenue: number;
  target: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="h-80">
      <h3 className="text-lg font-semibold mb-4">Doanh thu theo tháng</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            className="text-sm text-muted-foreground"
          />
          <YAxis 
            className="text-sm text-muted-foreground"
            tickFormatter={(value) => `${value / 1000000}M`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
            formatter={(value) => [`${Number(value).toLocaleString('vi-VN')} VND`, 'Doanh thu']}
          />
          <Bar 
            dataKey="revenue" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="target" 
            fill="hsl(var(--muted))"
            radius={[4, 4, 0, 0]}
            opacity={0.5}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;