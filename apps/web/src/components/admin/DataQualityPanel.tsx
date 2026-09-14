import { Card, CardHeader } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";

export interface DataQualityMetric {
  key: string;
  label: string;
  value: number;
  target: number;
  unit?: string;
}

export interface DataQualityPanelProps {
  metrics: DataQualityMetric[];
}

export function DataQualityPanel({ metrics }: DataQualityPanelProps) {
  return (
    <Card>
      <CardHeader title="Data quality" />
      <ul className="space-y-3">
        {metrics.map((metric) => (
          <li key={metric.key}>
            <div className="flex items-center justify-between text-xs text-neutral-700">
              <span>{metric.label}</span>
              <span>
                {metric.value}
                {metric.unit ?? "%"} / {metric.target}
                {metric.unit ?? "%"}
              </span>
            </div>
            <ProgressBar
              className="mt-1"
              value={metric.value}
              max={metric.target}
              tone={metric.value >= metric.target ? "success" : "warning"}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}