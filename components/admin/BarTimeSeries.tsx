'use client';

import { useId, useState } from 'react';

/**
 * Single-series daily bar chart.
 *
 * Deliberately one series per chart: visits and orders differ by orders of
 * magnitude, and plotting them together would need two y-scales, which
 * misrepresents the relationship. Two small charts side by side compare
 * honestly on a shared time axis.
 */

export type BarPoint = { date: string; value: number };

export default function BarTimeSeries({
  data,
  color,
  label,
  unit,
}: {
  data: BarPoint[];
  /** Single hue for the series. Must clear 3:1 against the white card surface. */
  color: string;
  label: string;
  /**
   * Singular noun for the tooltip, e.g. "visit" → "3 visits".
   *
   * A string rather than a formatter function: this is a Client Component, and
   * React cannot serialise a function passed from a Server Component across the
   * boundary.
   */
  unit: string;
}) {
  const formatValue = (value: number) => `${value} ${unit}${value === 1 ? '' : 's'}`;

  const clipId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const width = 560;
  const height = 160;
  const padding = { top: 14, right: 8, bottom: 22, left: 8 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const max = Math.max(1, ...data.map((point) => point.value));
  const slot = data.length > 0 ? plotWidth / data.length : plotWidth;
  // 2px of surface between neighbouring bars keeps them readable when adjacent.
  const barWidth = Math.max(3, slot - 2);

  const active = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label} over the last ${data.length} days`}
        className="w-full"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {/* Rounds only the top of each bar; the base stays anchored to the axis. */}
          <clipPath id={clipId}>
            <rect x="0" y="0" width={width} height={height - padding.bottom} />
          </clipPath>
        </defs>

        {/* Recessive baseline */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#dfe6ee"
          strokeWidth="1"
        />

        <g clipPath={`url(#${clipId})`}>
          {data.map((point, index) => {
            const barHeight = (point.value / max) * plotHeight;
            const x = padding.left + index * slot + (slot - barWidth) / 2;
            const y = height - padding.bottom - barHeight;
            const isHovered = hover === index;

            return (
              <g key={point.date}>
                {/* Full-height hit area — easier to hover than a 3px bar. */}
                <rect
                  x={padding.left + index * slot}
                  y={padding.top}
                  width={slot}
                  height={plotHeight}
                  fill="transparent"
                  onMouseEnter={() => setHover(index)}
                />
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, point.value > 0 ? 2 : 0)}
                  rx="3"
                  fill={color}
                  opacity={hover === null || isHovered ? 1 : 0.45}
                  className="transition-opacity"
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </g>

        {/* Only the first and last day are labelled — a label per bar is noise. */}
        {data.length > 0 && (
          <>
            <text
              x={padding.left}
              y={height - 6}
              className="fill-neutral-400"
              style={{ fontSize: 10 }}
            >
              {shortDate(data[0]!.date)}
            </text>
            <text
              x={width - padding.right}
              y={height - 6}
              textAnchor="end"
              className="fill-neutral-400"
              style={{ fontSize: 10 }}
            >
              {shortDate(data[data.length - 1]!.date)}
            </text>
          </>
        )}
      </svg>

      {active && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg border border-mist-200 bg-white px-3 py-1.5 text-xs shadow-sm">
          <span className="font-medium text-denim-800">{formatValue(active.value)}</span>
          <span className="ml-2 text-neutral-500">{longDate(active.date)}</span>
        </div>
      )}
    </div>
  );
}

function shortDate(iso: string) {
  const [, month, day] = iso.split('-');
  return `${day} ${monthName(Number(month))}`;
}

function longDate(iso: string) {
  const [year, month, day] = iso.split('-');
  return `${day} ${monthName(Number(month))} ${year}`;
}

function monthName(month: number) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
    Math.max(0, Math.min(11, month - 1))
  ];
}
