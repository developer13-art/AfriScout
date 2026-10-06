export type OpportunityGraphNodeKind =
  "organization" | "opportunity" | "skill" | "credential" | "people" | "reputation";

export interface OpportunityGraphNode {
  id: string;
  kind: OpportunityGraphNodeKind;
  label: string;
  detail?: string;
  href?: string;
  metrics?: Record<string, number | string | boolean>;
}

export interface OpportunityGraphEdge {
  id: string;
  source: string;
  target: string;
  kind: "publishes" | "requires" | "issued" | "contribution" | "earns";
  weight?: number;
}

export interface OpportunityGraph {
  nodes: OpportunityGraphNode[];
  edges: OpportunityGraphEdge[];
  totals: {
    organizations: number;
    opportunities: number;
    skills: number;
    achievements: number;
    contributors: number;
    reputationPoints: number;
  };
  sampled: boolean;
}
