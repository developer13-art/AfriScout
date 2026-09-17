import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

export interface MapCountryData {
  countryCode: string;
  countryName: string | null;
  count: number;
}

export interface AfricaOpportunityMapProps {
  data: MapCountryData[];
  height?: number;
  onSelectCountry?: (countryCode: string) => void;
  compact?: boolean;
}

const NUMERIC_TO_ALPHA2: Record<string, string> = {
  "012": "DZ",
  "024": "AO",
  "204": "BJ",
  "072": "BW",
  "854": "BF",
  "108": "BI",
  "132": "CV",
  "120": "CM",
  "140": "CF",
  "148": "TD",
  "174": "KM",
  "178": "CG",
  "180": "CD",
  "384": "CI",
  "262": "DJ",
  "818": "EG",
  "226": "GQ",
  "232": "ER",
  "748": "SZ",
  "231": "ET",
  "266": "GA",
  "270": "GM",
  "288": "GH",
  "324": "GN",
  "624": "GW",
  "404": "KE",
  "426": "LS",
  "430": "LR",
  "434": "LY",
  "450": "MG",
  "454": "MW",
  "466": "ML",
  "478": "MR",
  "480": "MU",
  "504": "MA",
  "508": "MZ",
  "516": "NA",
  "562": "NE",
  "566": "NG",
  "646": "RW",
  "678": "ST",
  "686": "SN",
  "690": "SC",
  "694": "SL",
  "706": "SO",
  "710": "ZA",
  "728": "SS",
  "729": "SD",
  "834": "TZ",
  "768": "TG",
  "788": "TN",
  "800": "UG",
  "894": "ZM",
  "716": "ZW",
};

/*
 * Stronger AfriScout color scale:
 *
 * None      -> slate gray
 * Low       -> light green
 * Medium    -> emerald
 * High      -> teal
 * Very high -> deep green
 */
const SCALE = [
  "#E2E8F0",
  "#A7F3D0",
  "#34D399",
  "#0D9488",
  "#047857",
];

const LABEL_COUNTRIES = new Set([
  "DZ",
  "EG",
  "LY",
  "SD",
  "TD",
  "NE",
  "ML",
  "MR",
  "SN",
  "GN",
  "CI",
  "GH",
  "NG",
  "CM",
  "CF",
  "CD",
  "ET",
  "KE",
  "TZ",
  "MZ",
  "MG",
  "AO",
  "ZM",
  "ZW",
  "BW",
  "NA",
  "ZA",
  "SO",
]);

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

export function AfricaOpportunityMap({
  data,
  height = 420,
  onSelectCountry,
  compact = false,
}: AfricaOpportunityMapProps) {
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

  const byCode = useMemo(() => {
    const map = new Map<string, MapCountryData>();

    for (const row of data) {
      map.set(row.countryCode.toUpperCase(), row);
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
          projection="geoMercator"
          projectionConfig={{
            scale: compact ? 320 : 400,
            center: [17, 2],
          }}
          width={600}
          height={640}
          style={{
            width: "100%",
            height: "auto",
          }}
        >
          <Geographies geography={topology as never}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericId = String(geo.id).padStart(
                  3,
                  "0",
                );

                const alpha2 =
                  NUMERIC_TO_ALPHA2[numericId];

                /*
                 * Countries outside Africa remain
                 * visually subdued so Africa stays
                 * as the main focus of the map.
                 */
                if (!alpha2) {
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#F8FAFC"
                      stroke="#CBD5E1"
                      strokeWidth={0.45}
                    />
                  );
                }

                const row = byCode.get(alpha2);
                const count = row?.count ?? 0;

                const fill = colorForCount(
                  count,
                  max,
                );

                const isLabel =
                  LABEL_COUNTRIES.has(alpha2) &&
                  count > 0;

                return (
                  <g key={geo.rsmKey}>
                    <Geography
                      geography={geo}
                      fill={fill}
                      stroke="#FFFFFF"
                      strokeWidth={0.8}
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
                            alpha2,
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
                      onClick={() =>
                        onSelectCountry?.(alpha2)
                      }
                      className={
                        onSelectCountry
                          ? "cursor-pointer outline-none transition-all duration-150 hover:opacity-75"
                          : "outline-none"
                      }
                    />

                    {isLabel ? (
                      <text
                        x={
                          geo.properties?.centroid?.[0] ??
                          0
                        }
                        y={
                          geo.properties?.centroid?.[1] ??
                          0
                        }
                        textAnchor="middle"
                        fontSize={compact ? 9 : 11}
                        fontWeight={700}
                        fill={
                          count > max * 0.5
                            ? "#FFFFFF"
                            : "#064E3B"
                        }
                        pointerEvents="none"
                      >
                        {count}
                      </text>
                    ) : null}
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
          Opportunities
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