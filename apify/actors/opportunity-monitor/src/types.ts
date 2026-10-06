export interface ActorInput {
  opportunityId: string;
  sourceUrl: string;
  adapter: string;
  previousSnapshot?: Record<string, unknown>;
}

export interface MonitorResult {
  opportunityId: string;
  changed: boolean;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
}