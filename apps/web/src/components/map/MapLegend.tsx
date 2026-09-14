export interface MapLegendItem {
  label: string;
  color: string;
  min: number;
  max: number;
}

export interface MapLegendProps {
  items: MapLegendItem[];
  title?: string;
}

export function MapLegend({ items, title = "Opportunities" }: MapLegendProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="text-neutral-700">{item.label}</span>
            <span className="ml-auto text-neutral-500">
              {item.min.toLocaleString()}-{item.max.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}