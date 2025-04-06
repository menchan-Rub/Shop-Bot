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
import { useColorModeValue } from '@chakra-ui/react';

type SalesDataPoint = {
  date: string;
  sales: number;
  orders: number;
};

interface SalesChartProps {
  data: SalesDataPoint[];
}

// 日本円のフォーマッター
const yAxisFormatter = (value: number) => {
  if (value === 0) return '¥0';
  if (value >= 1000000) return `¥${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `¥${(value / 1000).toFixed(0)}K`;
  return `¥${value}`;
};

// ツールチップのカスタムフォーマッター
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}
      >
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{label}</p>
        <p style={{ color: '#0099ff', margin: '0' }}>
          売上: {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(payload[0].value)}
        </p>
        <p style={{ color: '#00bfff', margin: '0' }}>
          注文数: {payload[1].value}
        </p>
      </div>
    );
  }
  return null;
};

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const lineColor1 = useColorModeValue('#0099ff', '#4dbbff'); // brand.500, brand.300
  const lineColor2 = useColorModeValue('#00bfff', '#4dd5ff'); // accent.500, accent.300
  const gridColor = useColorModeValue('#e2e8f0', '#2d3748'); // gray.200, gray.700
  const textColor = useColorModeValue('#4a5568', '#a0aec0'); // gray.600, gray.400

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: textColor, fontSize: 12 }}
          tickMargin={10}
          axisLine={{ stroke: gridColor }}
          tickLine={{ stroke: gridColor }}
        />
        <YAxis 
          yAxisId="left"
          tickFormatter={yAxisFormatter}
          tick={{ fill: textColor, fontSize: 12 }}
          axisLine={{ stroke: gridColor }}
          tickLine={{ stroke: gridColor }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fill: textColor, fontSize: 12 }}
          axisLine={{ stroke: gridColor }}
          tickLine={{ stroke: gridColor }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ 
            paddingTop: 10,
            fontSize: 12,
            color: textColor
          }} 
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="sales"
          name="売上"
          stroke={lineColor1}
          strokeWidth={2}
          activeDot={{ r: 8, fill: lineColor1, stroke: 'white', strokeWidth: 2 }}
          dot={{ r: 4, fill: 'white', stroke: lineColor1, strokeWidth: 2 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="orders"
          name="注文数"
          stroke={lineColor2}
          strokeWidth={2}
          activeDot={{ r: 6, fill: lineColor2, stroke: 'white', strokeWidth: 2 }}
          dot={{ r: 3, fill: 'white', stroke: lineColor2, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SalesChart; 