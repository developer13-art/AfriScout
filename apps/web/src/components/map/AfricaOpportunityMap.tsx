import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

export interface MapCountryData {
  countryCode: string;
  countryName: string | null;
  count: number;
}

export interface GlobalOpportunityMapProps {
  data: MapCountryData[];
  height?: number;
  onSelectCountry?: (countryCode: string) => void;
  compact?: boolean;
}

const SCALE = [
  "#E2E8F0",
  "#A7F3D0",
  "#34D399",
  "#0D9488",
  "#047857",
];

const REGION_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  "united states of america": "united states",
  "congo kinshasa": "dem rep congo",
  "democratic republic of the congo": "dem rep congo",
  "dem rep congo": "dem rep congo",
  "congo brazzaville": "congo",
  "republic of the congo": "congo",
  "ivory coast": "cote d ivoire",
  "cote d ivoire": "cote d ivoire",
  "czech republic": "czechia",
  "central african republic": "central african republic",
  "central african rep": "central african republic",
  "dominican republic": "dominican republic",
  "dominican rep": "dominican republic",
  "western sahara": "western sahara",
  "w sahara": "western sahara",
  "falkland islands": "falkland islands",
  "falkland is": "falkland islands",
  "equatorial guinea": "equatorial guinea",
  "eq guinea": "equatorial guinea",
  "sao tome principe": "sao tome and principe",
  "sao tome and principe": "sao tome and principe",
  "solomon islands": "solomon islands",
  "solomon is": "solomon islands",
  swaziland: "eswatini",
  "east timor": "timor leste",
  "cape verde": "cabo verde",
  "north macedonia": "north macedonia",
  macedonia: "north macedonia",
  "myanmar burma": "myanmar",
  "palestinian territories": "palestine",
  palestine: "palestine",
  turkey: "turkiye",
  turkiye: "turkiye",
  "vatican city": "vatican",
  vatican: "vatican",
};

function normalizeCountryName(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return (COUNTRY_NAME_ALIASES[normalized] ?? normalized)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function colorForCount(count: number, max: number): string {
  if (count <= 0 || max <= 0) {
    return SCALE[0]!;
  }

  const ratio = count / max;

  if (ratio < 0.1) {
    return SCALE[1]!;
  }

  if (ratio < 0.3) {
    return SCALE[2]!;
  }

  if (ratio < 0.7) {
    return SCALE[3]!;
  }

  return SCALE[4]!;
}

export function GlobalOpportunityMap({
  data,
  height = 420,
  onSelectCountry,
  compact = false,
}: GlobalOpportunityMapProps) {
  const [tooltip, setTooltip] = useState<{
    label: string;
    value: string;
    x: number;
    y: number;
  } | null>(null);

  const [topology, setTopology] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/world-110m.json")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(res.status),
      )
      .then((json) => {
        if (!cancelled) {
          setTopology(json);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(
          "Failed to load world map topology",
          err,
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const byCountryName = useMemo(() => {
    const map = new Map<string, MapCountryData>();

    for (const row of data) {
      const countryName =
        row.countryName ??
        REGION_NAMES.of(row.countryCode.toUpperCase()) ??
        row.countryCode;
      map.set(normalizeCountryName(countryName), { ...row, countryName });
    }

    return map;
  }, [data]);

  const max = useMemo(
    () =>
      data.reduce(
        (acc, row) => Math.max(acc, row.count),
        0,
      ),
    [data],
  );

  const legendItems = [
    {
      label: "None",
      color: SCALE[0]!,
      range: "0",
    },
    {
      label: "Low",
      color: SCALE[1]!,
      range: `1-${Math.max(
        1,
        Math.ceil(max * 0.1),
      )}`,
    },
    {
      label: "Medium",
      color: SCALE[2]!,
      range: `${Math.ceil(max * 0.1) + 1}-${Math.max(
        1,
        Math.ceil(max * 0.3),
      )}`,
    },
    {
      label: "High",
      color: SCALE[3]!,
      range: `${Math.ceil(max * 0.3) + 1}-${Math.max(
        1,
        Math.ceil(max * 0.7),
      )}`,
    },
    {
      label: "Very high",
      color: SCALE[4]!,
      range: `${Math.ceil(max * 0.7) + 1}+`,
    },
  ];

  return (
    <div className="relative w-full">
      {!topology ? (
        <div
          className="flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50"
          style={{ height }}
        >
          <span className="text-xs text-neutral-500">
            Loading map
          </span>
        </div>
      ) : (
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{
            scale: compact ? 145 : 170,
            center: [0, 0],
          }}
          width={760}
          height={430}
          style={{
            width: "100%",
            height: "auto",
          }}
        >
          <Geographies geography={topology as never}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName = String(geo.properties?.name ?? "");
                const row = byCountryName.get(normalizeCountryName(geoName));
                const count = row?.count ?? 0;

                const fill = colorForCount(
                  count,
                  max,
                );

                return (
                  <g key={geo.rsmKey}>
                    <Geography
                      geography={geo}
                      fill={row ? fill : "#F8FAFC"}
                      stroke={row ? "#FFFFFF" : "#CBD5E1"}
                      strokeWidth={0.45}
                      onMouseMove={(event) => {
                        const target =
                          event.currentTarget as SVGPathElement;

                        const rect =
                          target.ownerSVGElement?.getBoundingClientRect();

                        const x = rect
                          ? event.clientX - rect.left
                          : event.clientX;

                        const y = rect
                          ? event.clientY - rect.top
                          : event.clientY;

                        setTooltip({
                          label:
                            row?.countryName ??
                            geoName,
                          value: `${count} ${
                            count === 1
                              ? "opportunity"
                              : "opportunities"
                          }`,
                          x,
                          y,
                        });
                      }}
                      onMouseLeave={() =>
                        setTooltip(null)
                      }
                      onClick={() => {
                        if (row) onSelectCountry?.(row.countryCode);
                      }}
                      className={
                        onSelectCountry && row
                          ? "cursor-pointer outline-none transition-all duration-150 hover:opacity-75"
                          : "outline-none"
                      }
                    />
                  </g>
                );
              })
            }
          </Geographies>
        </ComposableMap>
      )}

      {tooltip ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-md bg-slate-950 px-3 py-2 text-xs text-white shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <p className="font-semibold">
            {tooltip.label}
          </p>

          <p className="mt-0.5 text-white/80">
            {tooltip.value}
          </p>
        </div>
      ) : null}

      <div className="mt-3 rounded-lg border border-neutral-200 bg-white/95 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Opportunities by country
        </p>

        <ul className="mt-2 space-y-1">
          {legendItems.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{
                  backgroundColor: item.color,
                }}
                aria-hidden
              />

              <span className="text-neutral-700">
                {item.label}
              </span>

              <span className="ml-auto text-neutral-500">
                {item.range}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Keep the legacy export while existing consumers migrate to the global view.
export const AfricaOpportunityMap = GlobalOpportunityMap;