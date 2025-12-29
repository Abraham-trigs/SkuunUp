"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface DataItem {
  className: string;
  count: number;
}

interface StudentsPerClassChartProps {
  data: DataItem[];
  onBarClick?: (data: DataItem) => void;
}

export default function StudentsPerClassChart({
  data,
  onBarClick,
}: StudentsPerClassChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1c376e"
          vertical={false}
        />

        <XAxis
          dataKey="className"
          stroke="#BFCDEF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dy={10}
        />

        <YAxis
          stroke="#BFCDEF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip
          cursor={{ fill: "#1c376e", opacity: 0.4 }}
          contentStyle={{
            backgroundColor: "#03102b",
            borderColor: "#1c376e",
            borderRadius: "8px",
            color: "#BFCDEF",
          }}
          itemStyle={{ color: "#6BE8EF" }}
        />

        <Bar
          dataKey="count"
          radius={[4, 4, 0, 0]}
          style={{ cursor: "pointer" }}
          onClick={(barData) => {
            if (barData?.payload) {
              onBarClick?.(barData.payload as DataItem);
            }
          }}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill="#6BE8EF"
              className="transition-all duration-300 hover:fill-[#E74C3C]"
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
