"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** A small, calm line. No grid, no legend, no gradient fill. */
export function ScoreChart({
  data,
}: {
  data: { label: string; score: number }[];
}) {
  return (
    <div className="h-40 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            dy={6}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "none",
              color: "var(--popover-foreground)",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            formatter={(value) => [`${value}%`, "Score"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "var(--chart-1)", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
