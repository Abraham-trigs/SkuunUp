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

interface StudentsPerClassChartProps {
  data: { className: string; count: number }[];
}

export default function StudentsPerClassChart({
  data,
}: StudentsPerClassChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        {/* Subtle grid using Deep Blue */}
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1c376e"
          vertical={false}
        />

        <XAxis
          dataKey="className"
          stroke="#BFCDEF" // --color-ark-lightblue
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dy={10}
        />

        <YAxis
          stroke="#BFCDEF" // --color-ark-lightblue
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip
          cursor={{ fill: "#1c376e", opacity: 0.4 }} // Highlight background on hover
          contentStyle={{
            backgroundColor: "#03102b", // --color-ark-navy
            borderColor: "#1c376e",
            borderRadius: "8px",
            color: "#BFCDEF",
          }}
          itemStyle={{ color: "#6BE8EF" }}
        />

        <Bar
          dataKey="count"
          radius={[4, 4, 0, 0]} // Rounded corners on top
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill="#6BE8EF" // --color-ark-cyan (Main Bar Color)
              className="transition-all duration-300 hover:fill-[#E74C3C]" // Changes to Red on hover
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
