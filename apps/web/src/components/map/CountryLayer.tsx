import type { MouseEvent } from "react";
import { cn } from "../../utils/strings";

export interface CountryData {
  countryCode: string;
  countryName: string;
  count: number;
  path: string;
}

export interface CountryLayerProps {
  countries: CountryData[];
  colorFor: (count: number) => string;
  onHover?: (country: CountryData, event: MouseEvent<SVGPathElement>) => void;
  onLeave?: () => void;
  onClick?: (country: CountryData) => void;
}

export function CountryLayer({
  countries,
  colorFor,
  onHover,
  onLeave,
  onClick,
}: CountryLayerProps) {
  return (
    <g>
      {countries.map((country) => (
        <path
          key={country.countryCode}
          d={country.path}
          fill={colorFor(country.count)}
          stroke="#ffffff"
          strokeWidth={0.5}
          className={cn("cursor-pointer transition-opacity hover:opacity-80")}
          onMouseMove={(event) => onHover?.(country, event)}
          onMouseLeave={() => onLeave?.()}
          onClick={() => onClick?.(country)}
          aria-label={`${country.countryName}: ${country.count} opportunities`}
        />
      ))}
    </g>
  );
}