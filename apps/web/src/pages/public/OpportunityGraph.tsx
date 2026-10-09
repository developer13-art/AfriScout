import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  CircleHelp,
  Filter,
  Handshake,
  Network,
  RefreshCw,
  Search,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { SeoHead } from "../../components/common/SeoHead";
import { ErrorState } from "../../components/ui/ErrorState";
import { Loader } from "../../components/ui/Loader";
import { useOpportunityGraph } from "../../hooks/useOpportunityGraph";
import type {
  OpportunityGraphEdge,
  OpportunityGraphNode,
  OpportunityGraphNodeKind,
} from "../../types/opportunityGraph";
import "./OpportunityGraph.css";

const kindOrder: OpportunityGraphNodeKind[] = [
  "organization",
  "opportunity",
  "skill",
  "credential",
  "people",
  "reputation",
];

const kindLabels: Record<OpportunityGraphNodeKind, string> = {
  organization: "Organizations",
  opportunity: "Opportunities",
  skill: "Skills",
  credential: "Achievements",
  people: "Contributors",
  reputation: "Reputation",
};

const edgeLabels: Record<OpportunityGraphEdge["kind"], string> = {
  publishes: "publishes",
  requires: "requires",
  issued: "issues proof for",
  contribution: "contributed to",
  earns: "earns",
};

const kindIcons: Record<OpportunityGraphNodeKind, typeof Building2> = {
  organization: Building2,
  opportunity: BriefcaseBusiness,
  skill: Sparkles,
  credential: BadgeCheck,
  people: UsersRound,
  reputation: Handshake,
};

const numberFormat = new Intl.NumberFormat("en");

function formatValue(value: string | number | boolean) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return numberFormat.format(value);
  return value;
}

function getNodeMetrics(node: OpportunityGraphNode) {
  return Object.entries(node.metrics ?? {}).slice(0, 2);
}

function RelationMap({
  nodes,
  edges,
  selectedId,
  onSelect,
}: {
  nodes: OpportunityGraphNode[];
  edges: OpportunityGraphEdge[];
  selectedId: string | null;
  onSelect: (node: OpportunityGraphNode) => void;
}) {
  const mapNodes = kindOrder.flatMap((kind) =>
    nodes.filter((node) => node.kind === kind).slice(0, 5),
  );
  const mapIds = new Set(mapNodes.map((node) => node.id));
  const positions = new Map<string, { x: number; y: number }>();
  const columnWidth = 800 / kindOrder.length;

  kindOrder.forEach((kind, column) => {
    const columnNodes = mapNodes.filter((node) => node.kind === kind);
    columnNodes.forEach((node, row) => {
      positions.set(node.id, {
        x: columnWidth * column + columnWidth / 2,
        y: 94 + row * 62,
      });
    });
  });

  const visibleEdges = edges
    .filter((edge) => mapIds.has(edge.source) && mapIds.has(edge.target))
    .slice(0, 90);

  return (
    <div className="scout-map-scroll" aria-label="Opportunity connections map">
      <svg
        className="scout-map"
        viewBox="0 0 800 392"
        role="img"
        aria-labelledby="map-title map-description"
      >
        <title id="map-title">A view of connected Scout records</title>
        <desc id="map-description">
          Records are arranged by type. Lines represent published opportunities, required skills,
          issued achievements, contributions, and earned reputation.
        </desc>
        {kindOrder.map((kind, index) => (
          <g key={kind}>
            <text
              className="scout-map-heading"
              x={columnWidth * index + columnWidth / 2}
              y="25"
              textAnchor="middle"
            >
              {kindLabels[kind]}
            </text>
            <line
              className="scout-map-guide"
              x1={columnWidth * index + columnWidth / 2}
              y1="42"
              x2={columnWidth * index + columnWidth / 2}
              y2="365"
            />
          </g>
        ))}
        {visibleEdges.map((edge) => {
          const source = positions.get(edge.source);
          const target = positions.get(edge.target);
          if (!source || !target) return null;
          return (
            <line
              key={edge.id}
              className={`scout-map-edge scout-map-edge-${edge.kind}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              strokeWidth={Math.min(3.5, 1.1 + (edge.weight ?? 0) * 0.15)}
            />
          );
        })}
        {mapNodes.map((node) => {
          const point = positions.get(node.id);
          if (!point) return null;
          return (
            <g
              key={node.id}
              className={`scout-map-node scout-kind-${node.kind}${selectedId === node.id ? " is-selected" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`${node.label}, ${kindLabels[node.kind].toLowerCase()}`}
              onClick={() => onSelect(node)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(node);
                }
              }}
            >
              <circle className="scout-map-dot" cx={point.x} cy={point.y} r="7" />
              <text x={point.x} y={point.y + 21} textAnchor="middle">
                {node.label.length > 15 ? `${node.label.slice(0, 14)}…` : node.label}
              </text>
              <title>{node.label}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function OpportunityGraph() {
  const graph = useOpportunityGraph();
  const [activeKind, setActiveKind] = useState<OpportunityGraphNodeKind | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nodes = graph.data?.nodes ?? [];
  const edges = graph.data?.edges ?? [];
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const filteredNodes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return nodes.filter((node) => {
      const matchesKind = activeKind === "all" || node.kind === activeKind;
      const matchesSearch =
        !query ||
        node.label.toLocaleLowerCase().includes(query) ||
        node.detail?.toLocaleLowerCase().includes(query) ||
        Object.values(node.metrics ?? {}).some((value) =>
          String(value).toLocaleLowerCase().includes(query),
        );
      return matchesKind && matchesSearch;
    });
  }, [activeKind, nodes, search]);
  const selectedNode = selectedId ? (nodeById.get(selectedId) ?? null) : null;
  const relatedEdges = selectedNode
    ? edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
    : [];
  const connectedRecords = relatedEdges
    .map((edge) => ({
      edge,
      node: nodeById.get(edge.source === selectedNode?.id ? edge.target : edge.source),
    }))
    .filter((item): item is { edge: OpportunityGraphEdge; node: OpportunityGraphNode } =>
      Boolean(item.node),
    );

  const totals = graph.data?.totals;
  const stats = [
    {
      label: "Organizations",
      value: totals?.organizations ?? 0,
      icon: Building2,
      kind: "organization" as const,
    },
    {
      label: "Opportunities",
      value: totals?.opportunities ?? 0,
      icon: BriefcaseBusiness,
      kind: "opportunity" as const,
    },
    { label: "Skills", value: totals?.skills ?? 0, icon: Sparkles, kind: "skill" as const },
    {
      label: "Achievements",
      value: totals?.achievements ?? 0,
      icon: BadgeCheck,
      kind: "credential" as const,
    },
  ];

  return (
    <>
      <SeoHead
        title="Opportunity Network"
        description="Explore the live connections between Scout organizations, opportunities, skills, and organization-issued proof of completed work."
      />
      <main className="opportunity-network">
        <Container className="opportunity-network-container">
          <header className="network-intro">
            <div className="network-intro-copy">
              <div className="network-eyebrow">
                <span className="network-live-dot" /> Scout opportunity graph
              </div>
              <h1>
                Good work leaves <em>connections.</em>
              </h1>
              <p>
                Explore how real public opportunities connect organizations, required skills, and
                organization-issued proof of completed work.
              </p>
            </div>
            <div className="network-intro-mark" aria-hidden="true">
              <Network size={44} strokeWidth={1.35} />
              <span className="mark-orbit mark-orbit-one" />
              <span className="mark-orbit mark-orbit-two" />
            </div>
          </header>

          {graph.isLoading ? (
            <div className="network-state-panel">
              <Loader label="Loading opportunity network" />
            </div>
          ) : graph.isError ? (
            <div className="network-state-panel">
              <ErrorState
                title="Could not load the opportunity network"
                description="The live Scout network data could not be reached."
                action={
                  <button
                    type="button"
                    className="network-retry"
                    onClick={() => void graph.refetch()}
                  >
                    <RefreshCw size={14} /> Try again
                  </button>
                }
              />
            </div>
          ) : (
            <>
              <section className="network-overview" aria-label="Network overview">
                <div className="overview-lead">
                  <span className="overview-label">In the network</span>
                  <strong>{numberFormat.format(nodes.length)}</strong>
                  <span>connected records</span>
                  <span className="overview-separator" />
                  <span>{numberFormat.format(edges.length)} relationships</span>
                  <span className="overview-separator" />
                  <span>{numberFormat.format(totals?.contributors ?? 0)} contributors</span>
                  {graph.data?.sampled && <span className="sampled-tag">Sampled view</span>}
                </div>
                <div className="overview-stats">
                  {stats.map(({ label, value, icon: Icon, kind }) => (
                    <button
                      key={label}
                      type="button"
                      className={`overview-stat scout-kind-${kind}`}
                      onClick={() => {
                        setActiveKind(activeKind === kind ? "all" : kind);
                        document
                          .getElementById("network-directory")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      aria-label={`Show ${label.toLowerCase()}`}
                    >
                      <span className="overview-stat-icon">
                        <Icon size={16} />
                      </span>
                      <span className="overview-stat-value">{numberFormat.format(value)}</span>
                      <span className="overview-stat-label">{label}</span>
                      <ChevronRight className="overview-stat-arrow" size={14} />
                    </button>
                  ))}
                  <div className="reputation-stat">
                    <span className="reputation-label">Network reputation</span>
                    <strong>{numberFormat.format(totals?.reputationPoints ?? 0)}</strong>
                    <span>points recorded</span>
                  </div>
                </div>
              </section>

              <div className="network-content-grid">
                <section className="network-map-panel" aria-labelledby="map-section-title">
                  <div className="section-heading-row">
                    <div>
                      <span className="section-kicker">01 / Relationships</span>
                      <h2 id="map-section-title">A network, not a list.</h2>
                    </div>
                    <span className="map-nodes-count">
                      Up to 30 of {numberFormat.format(nodes.length)} records
                    </span>
                  </div>
                  <p className="section-intro">
                    Select a record to see what it connects to. Each line represents a relationship
                    in the live graph.
                  </p>
                  <RelationMap
                    nodes={nodes}
                    edges={edges}
                    selectedId={selectedId}
                    onSelect={(node) => setSelectedId(node.id)}
                  />
                  <div className="relationship-legend" aria-label="Relationship types">
                    <span>
                      <i className="legend-dot legend-publishes" /> Publishes
                    </span>
                    <span>
                      <i className="legend-dot legend-requires" /> Requires
                    </span>
                    <span>
                      <i className="legend-dot legend-issued" /> Issued
                    </span>
                    <span>
                      <i className="legend-dot legend-contribution" /> Contribution
                    </span>
                    <span>
                      <i className="legend-dot legend-earns" /> Earns
                    </span>
                  </div>
                </section>

                <aside
                  className={`network-detail-panel${selectedNode ? " has-selection" : ""}`}
                  aria-live="polite"
                >
                  {selectedNode ? (
                    <>
                      <div className="detail-topline">
                        <span className={`detail-kind scout-kind-${selectedNode.kind}`}>
                          {kindLabels[selectedNode.kind]}
                        </span>
                        <button
                          type="button"
                          className="detail-close"
                          onClick={() => setSelectedId(null)}
                          aria-label="Close selected record"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <h2>{selectedNode.label}</h2>
                      {selectedNode.detail && (
                        <p className="detail-description">{selectedNode.detail}</p>
                      )}
                      {getNodeMetrics(selectedNode).length > 0 && (
                        <div className="detail-metrics">
                          {getNodeMetrics(selectedNode).map(([key, value]) => (
                            <span key={key}>
                              <b>{formatValue(value)}</b>
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="detail-connections-heading">
                        <span>Connected records</span>
                        <span className="connection-count">{connectedRecords.length}</span>
                      </div>
                      {connectedRecords.length ? (
                        <ul className="connection-list">
                          {connectedRecords.slice(0, 7).map(({ edge, node }) => {
                            const isOutgoing = edge.source === selectedNode.id;
                            return (
                              <li key={edge.id}>
                                <span
                                  className={`connection-direction ${isOutgoing ? "direction-out" : "direction-in"}`}
                                  aria-label={isOutgoing ? "Outgoing" : "Incoming"}
                                >
                                  {isOutgoing ? (
                                    <ArrowUpRight size={14} />
                                  ) : (
                                    <ArrowDownRight size={14} />
                                  )}
                                </span>
                                <span className="connection-copy">
                                  <span>
                                    {isOutgoing
                                      ? edgeLabels[edge.kind]
                                      : `${edgeLabels[edge.kind]} this`}
                                  </span>
                                  <button type="button" onClick={() => setSelectedId(node.id)}>
                                    {node.label}
                                  </button>
                                </span>
                              </li>
                            );
                          })}
                          {connectedRecords.length > 7 && (
                            <li className="connection-more">
                              + {connectedRecords.length - 7} more connections
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="detail-empty">
                          No connected records are listed for this entry.
                        </p>
                      )}
                      {selectedNode.href && (
                        <Link className="detail-link" to={selectedNode.href}>
                          Open this record <ArrowUpRight size={15} />
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="detail-placeholder">
                      <span className="detail-placeholder-icon">
                        <CircleHelp size={21} />
                      </span>
                      <span className="section-kicker">Explore a connection</span>
                      <h2>Choose any point on the map.</h2>
                      <p>
                        See its linked organizations, opportunities, skills, and proof of completed
                        work.
                      </p>
                      <div className="detail-note">
                        <BadgeCheck size={16} />
                        <span>
                          Achievements are issued by organizations. Scout does not verify the work
                          independently.
                        </span>
                      </div>
                    </div>
                  )}
                </aside>
              </div>

              <section
                className="network-directory"
                id="network-directory"
                aria-labelledby="directory-title"
              >
                <div className="directory-header">
                  <div>
                    <span className="section-kicker">02 / Browse the graph</span>
                    <h2 id="directory-title">Find a record.</h2>
                    <p>Every entry below comes from Scout’s public opportunity graph.</p>
                  </div>
                  <div className="directory-tools">
                    <label className="network-search">
                      <Search size={16} />
                      <span className="sr-only">Search records</span>
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search records"
                      />
                      {search && (
                        <button
                          type="button"
                          aria-label="Clear search"
                          onClick={() => setSearch("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                    <span className="directory-result-count">
                      {numberFormat.format(filteredNodes.length)} records
                    </span>
                  </div>
                </div>
                <div className="directory-filters" aria-label="Filter records by type">
                  <Filter size={15} />
                  <button
                    type="button"
                    className={activeKind === "all" ? "is-active" : ""}
                    onClick={() => setActiveKind("all")}
                  >
                    All records
                  </button>
                  {kindOrder.map((kind) => (
                    <button
                      type="button"
                      key={kind}
                      className={`filter-kind-${kind}${activeKind === kind ? " is-active" : ""}`}
                      onClick={() => setActiveKind(activeKind === kind ? "all" : kind)}
                    >
                      {kindLabels[kind]}
                    </button>
                  ))}
                </div>
                {filteredNodes.length ? (
                  <div className="directory-grid">
                    {filteredNodes.map((node) => {
                      const Icon = kindIcons[node.kind];
                      const relationCount = edges.filter(
                        (edge) => edge.source === node.id || edge.target === node.id,
                      ).length;
                      return (
                        <button
                          type="button"
                          className={`directory-record scout-kind-${node.kind}${selectedId === node.id ? " is-selected" : ""}`}
                          key={node.id}
                          onClick={() => {
                            setSelectedId(node.id);
                            document
                              .querySelector(".network-map-panel")
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          <span className="record-icon">
                            <Icon size={17} />
                          </span>
                          <span className="record-main">
                            <span className="record-kind">
                              {kindLabels[node.kind].replace(/s$/, "")}
                            </span>
                            <span className="record-title">{node.label}</span>
                            {node.detail && <span className="record-detail">{node.detail}</span>}
                          </span>
                          <span className="record-connections">
                            {numberFormat.format(relationCount)} links
                          </span>
                          <ChevronRight className="record-chevron" size={16} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="directory-empty">
                    <Search size={20} />
                    <h3>No matching records</h3>
                    <p>Try another search or clear the current filters.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setActiveKind("all");
                      }}
                    >
                      Clear search and filters
                    </button>
                  </div>
                )}
              </section>

              <footer className="network-footnote">
                <span>
                  <BadgeCheck size={16} /> Trust, with clear provenance.
                </span>
                <p>
                  Scout connects public listings and organization-issued proof. Connections describe
                  the data available in the graph; they are not an independent verification of
                  completed work.
                </p>
              </footer>
            </>
          )}
        </Container>
      </main>
    </>
  );
}
