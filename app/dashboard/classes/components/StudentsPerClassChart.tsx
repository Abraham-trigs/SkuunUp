"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataItem {
  className: string;
  count: number;
  id?: string;
}

interface StudentsPerClassChartProps {
  data: DataItem[];
  onBarClick?: (cls: DataItem) => void;
}

export default function StudentsPerClassChart({
  data,
  onBarClick,
}: StudentsPerClassChartProps) {
  return (
    <div
      style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
      className="w-full h-72 p-6 rounded-xl border shadow-xl flex flex-col"
    >
      <h2
        style={{ color: "#BFCDEF" }}
        className="text-lg font-bold mb-4 tracking-tight"
      >
        Students Per Class
      </h2>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
            onClick={(e) => {
              if (e && e.activePayload?.[0]?.payload) {
                onBarClick?.(e.activePayload[0].payload as DataItem);
              }
            }}
          >
            <XAxis
              dataKey="className"
              stroke="#BFCDEF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              allowDecimals={false}
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
              radius={[6, 6, 0, 0]}
              style={{ cursor: onBarClick ? "pointer" : "default" }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="#6BE8EF" // --color-ark-cyan
                  className="transition-all duration-300 hover:fill-[#E74C3C]" // Transitions to Red on hover
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
