"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AttendanceTrendChartProps {
  data: { date: string; attendance: number }[];
}

export default function AttendanceTrendChart({
  data,
}: AttendanceTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        {/* Grid lines using Deep Blue for a subtle look */}
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1c376e"
          vertical={false}
        />

        {/* X and Y Axis using Light Blue for readability */}
        <XAxis
          dataKey="date"
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

        {/* Custom Tooltip matching your Navy background */}
        <Tooltip
          contentStyle={{
            backgroundColor: "#03102b",
            borderColor: "#1c376e",
            color: "#BFCDEF",
            borderRadius: "8px",
          }}
          itemStyle={{ color: "#6BE8EF" }}
        />

        <Legend wrapperStyle={{ paddingTop: "20px" }} />

        {/* Main Line using Cyan with a Red glow or simple Cyan stroke */}
        <Line
          type="monotone"
          dataKey="attendance"
          stroke="#6BE8EF" // --color-ark-cyan
          strokeWidth={3}
          dot={{ fill: "#6BE8EF", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#BFCDEF", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
