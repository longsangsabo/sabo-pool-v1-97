import React from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TranslationMetrics {
  date: string;
  automated: number;
  manual: number;
  accuracy: number;
  total: number;
}

interface LanguagePairData {
  pair: string;
  count: number;
  accuracy: number;
}

interface TranslationAnalyticsChartProps {
  data: TranslationMetrics[];
  languagePairs: LanguagePairData[];
  title: string;
  type?: 'timeline' | 'distribution' | 'accuracy';
}

const TranslationAnalyticsChart: React.FC<TranslationAnalyticsChartProps> = ({ 
  data, 
  languagePairs,
  title, 
  type = 'timeline' 
}) => {
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--muted))',
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300'
  ];

  const renderTimelineChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="date" 
          stroke="hsl(var(--muted-foreground))"
          className="text-sm"
        />
        <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--foreground))'
          }}
          formatter={(value, name) => [
            typeof value === 'number' ? value.toLocaleString() : value,
            name === 'automated' ? 'Tự động' : 
            name === 'manual' ? 'Thủ công' : 
            name === 'accuracy' ? 'Độ chính xác (%)' : name
          ]}
        />
        <Legend />
        <Bar 
          yAxisId="left"
          dataKey="automated" 
          fill="hsl(var(--primary))" 
          name="Tự động"
          radius={[2, 2, 0, 0]}
        />
        <Bar 
          yAxisId="left"
          dataKey="manual" 
          fill="hsl(var(--secondary))" 
          name="Thủ công"
          radius={[2, 2, 0, 0]}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="accuracy" 
          stroke="hsl(var(--accent))" 
          strokeWidth={3}
          name="Độ chính xác (%)"
          dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderDistributionChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={languagePairs.slice(0, 6)}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({pair, percent}) => `${pair} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="count"
        >
          {languagePairs.slice(0, 6).map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--foreground))'
          }}
          formatter={(value) => [value.toLocaleString(), 'Số lượng dịch']}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderAccuracyChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={languagePairs.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="pair" 
          stroke="hsl(var(--muted-foreground))"
          className="text-sm"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--foreground))'
          }}
          formatter={(value, name) => [
            typeof value === 'number' ? value.toLocaleString() : value,
            name === 'count' ? 'Số lượng' : 'Độ chính xác (%)'
          ]}
        />
        <Bar 
          yAxisId="left"
          dataKey="count" 
          fill="hsl(var(--primary))" 
          name="Số lượng"
          radius={[2, 2, 0, 0]}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="accuracy" 
          stroke="hsl(var(--accent))" 
          strokeWidth={3}
          name="Độ chính xác (%)"
          dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (type) {
      case 'distribution':
        return renderDistributionChart();
      case 'accuracy':
        return renderAccuracyChart();
      default:
        return renderTimelineChart();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span>Dữ liệu thời gian thực</span>
        </div>
      </div>
      {renderChart()}
    </div>
  );
};

export default TranslationAnalyticsChart;