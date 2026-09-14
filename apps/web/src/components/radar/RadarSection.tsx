import type { ReactNode } from "react";
import { Card, CardHeader } from "../ui/Card";

export interface RadarSectionProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function RadarSection({
  title,
  subtitle,
  actions,
  children,
}: RadarSectionProps) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} actions={actions} />
      {children}
    </Card>
  );
}