import { useMemo, useState, type MouseEvent } from "react";
import type { CountryData } from "./CountryLayer";
import { CountryLayer } from "./CountryLayer";
import { MapTooltip } from "./MapTooltip";
import { MapLegend } from "./MapLegend";

export interface AfricaOpportunityMapProps {
  countries: CountryData[];
  height?: number;
  onSelectCountry?: (countryCode: string) => void;
}

const palette = ["#E6FFFA", "#99F6E4", "#5EEAD4", "#2DD4BF", "#14B8A6", "#0F766E"];

function colorForCount(count: number, max: number): string {
  if (max <= 0) return palette[0]!;
  const ratio = Math.min(1, count / max);
  const index = Math.min(palette.length - 1, Math.floor(ratio * palette.length));
  return palette[index]!;
}

export function AfricaOpportunityMap({
  countries,
  height = 420,
  onSelectCountry,
}: AfricaOpportunityMapProps) {
  const [tooltip, setTooltip] = useState<{
    label: string;
    value: string;
    x: number;
    y: number;
  } | null>(null);

  const max = useMemo(
    () => countries.reduce((acc, c) => Math.max(acc, c.count), 0),
    [countries],
  );

  const legendItems = [
    { label: "Very low", color: palette[0]!, min: 0, max: Math.ceil(max * 0.2) },
    { label: "Low", color: palette[1]!, min: Math.ceil(max * 0.2) + 1, max: Math.ceil(max * 0.4) },
    { label: "Medium", color: palette[2]!, min: Math.ceil(max * 0.4) + 1, max: Math.ceil(max * 0.6) },
    { label: "High", color: palette[3]!, min: Math.ceil(max * 0.6) + 1, max: Math.ceil(max * 0.8) },
    { label: "Very high", color: palette[5]!, min: Math.ceil(max * 0.8) + 1, max: max || 1 },
  ];

  return (
    <div className="relative">
      <svg
        viewBox="0 0 600 640"
        height={height}
        role="img"
        aria-label="Map of Africa with opportunity density"
        className="w-full"
      >
        <rect width="600" height="640" fill="#F8FAFC" />
        <CountryLayer
          countries={countries}
          colorFor={(count) => colorForCount(count, max)}
          onHover={(country, event: MouseEvent<SVGPathElement>) => {
            const container = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
            const x = container ? event.clientX - container.left : event.clientX;
            const y = container ? event.clientY - container.top : event.clientY;
            setTooltip({
              label: country.countryName,
              value: `${country.count} opportunities`,
              x,
              y,
            });
          }}
          onLeave={() => setTooltip(null)}
          onClick={(country) => onSelectCountry?.(country.countryCode)}
        />
      </svg>

      {tooltip ? (
        <MapTooltip
          label={tooltip.label}
          value={tooltip.value}
          x={tooltip.x}
          y={tooltip.y}
        />
      ) : null}

      <div className="absolute bottom-3 left-3">
        <MapLegend items={legendItems} />
      </div>
    </div>
  );
}