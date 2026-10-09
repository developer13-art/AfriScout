import { prisma } from "../../config/database";

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

const OPPORTUNITY_LIMIT = 100;
const ACHIEVEMENT_LIMIT = 200;

export async function getOpportunityGraph(): Promise<OpportunityGraph> {
  const [
    opportunities,
    achievements,
    opportunityTotal,
    opportunityOrganizations,
    achievementTotal,
    achievementPoints,
  ] = await Promise.all([
    prisma.opportunity.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: OPPORTUNITY_LIMIT,
      select: {
        id: true,
        title: true,
        slug: true,
        organizationId: true,
        organizationName: true,
        category: true,
        opportunityType: true,
        verificationStatus: true,
        provenanceProofs: { select: { id: true }, take: 1 },
        organization: {
          select: { id: true, name: true, slug: true, verified: true },
        },
        bounty: {
          select: {
            id: true,
            rewardAmount: true,
            rewardCurrency: true,
            fundingStatus: true,
            requiredSkills: true,
            submissions: {
              select: { userId: true },
            },
          },
        },
      },
    }),
    prisma.verifiedAchievement.findMany({
      orderBy: { issuedAt: "desc" },
      take: ACHIEVEMENT_LIMIT,
      select: {
        id: true,
        title: true,
        points: true,
        organizationId: true,
        opportunityId: true,
        organization: { select: { id: true, name: true, slug: true, verified: true } },
        opportunity: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.opportunity.count({ where: { status: "PUBLISHED" } }),
    prisma.opportunity.groupBy({
      by: ["organizationId"],
      where: { status: "PUBLISHED", organizationId: { not: null } },
    }),
    prisma.verifiedAchievement.count(),
    prisma.verifiedAchievement.aggregate({ _sum: { points: true } }),
  ]);

  const nodes = new Map<string, OpportunityGraphNode>();
  const edges = new Map<string, OpportunityGraphEdge>();
  const contributorIds = new Set<string>();
  const perOpportunityParticipants = new Map<string, number>();
  const skillIds = new Set<string>();
  const networkPoints = achievementPoints._sum.points ?? 0;

  for (const opportunity of opportunities) {
    const opportunityNodeId = `opportunity:${opportunity.id}`;
    nodes.set(opportunityNodeId, {
      id: opportunityNodeId,
      kind: "opportunity",
      label: opportunity.title,
      detail: `${opportunity.category} · ${opportunity.opportunityType}`,
      href: `/opportunities/${opportunity.slug}`,
      metrics: {
        scoutVerified: opportunity.verificationStatus === "VERIFIED",
        provenanceAnchored: opportunity.provenanceProofs.length > 0,
        hasBounty: Boolean(opportunity.bounty),
        ...(opportunity.bounty
          ? {
              rewardAmount: opportunity.bounty.rewardAmount.toString(),
              rewardCurrency: opportunity.bounty.rewardCurrency.trim(),
              fundingStatus: opportunity.bounty.fundingStatus,
            }
          : {}),
      },
    });

    const organization = opportunity.organization;
    const organizationId = organization?.id ?? opportunity.organizationId;
    const organizationName =
      organization?.name ?? opportunity.organizationName?.trim() ?? "Organization not listed";
    if (organizationId) {
      const organizationNodeId = `organization:${organizationId}`;
      nodes.set(organizationNodeId, {
        id: organizationNodeId,
        kind: "organization",
        label: organizationName,
        detail: organization?.verified ? "Scout-verified organization" : "Organization",
        metrics: { verified: organization?.verified ?? false },
      });
      const edgeId = `${organizationNodeId}->${opportunityNodeId}:publishes`;
      edges.set(edgeId, {
        id: edgeId,
        source: organizationNodeId,
        target: opportunityNodeId,
        kind: "publishes",
      });
    }

    const submissions = opportunity.bounty?.submissions ?? [];
    const participantIds = new Set(submissions.map((submission) => submission.userId));
    participantIds.forEach((userId) => contributorIds.add(userId));
    if (participantIds.size > 0) {
      perOpportunityParticipants.set(opportunityNodeId, participantIds.size);
    }

    for (const skill of opportunity.bounty?.requiredSkills ?? []) {
      const label = skill.trim();
      if (!label) continue;
      const skillId = `skill:${label.toLocaleLowerCase()}`;
      skillIds.add(skillId);
      nodes.set(skillId, { id: skillId, kind: "skill", label });
      const edgeId = `${opportunityNodeId}->${skillId}:requires`;
      edges.set(edgeId, {
        id: edgeId,
        source: opportunityNodeId,
        target: skillId,
        kind: "requires",
      });
    }
  }

  for (const achievement of achievements) {
    const credentialNodeId = `credential:${achievement.id}`;
    nodes.set(credentialNodeId, {
      id: credentialNodeId,
      kind: "credential",
      label: achievement.title,
      detail: `Organization-issued · ${achievement.points} reputation points`,
      metrics: { points: achievement.points },
    });

    const opportunityNodeId = `opportunity:${achievement.opportunityId}`;
    if (!nodes.has(opportunityNodeId)) {
      nodes.set(opportunityNodeId, {
        id: opportunityNodeId,
        kind: "opportunity",
        label: achievement.opportunity.title,
        detail: "Completed opportunity",
        href: `/opportunities/${achievement.opportunity.slug}`,
      });
    }
    const achievementOpportunityEdge = `${opportunityNodeId}->${credentialNodeId}:issued`;
    edges.set(achievementOpportunityEdge, {
      id: achievementOpportunityEdge,
      source: opportunityNodeId,
      target: credentialNodeId,
      kind: "issued",
    });

    const organizationNodeId = `organization:${achievement.organizationId}`;
    if (!nodes.has(organizationNodeId)) {
      nodes.set(organizationNodeId, {
        id: organizationNodeId,
        kind: "organization",
        label: achievement.organization.name,
        detail: achievement.organization.verified ? "Scout-verified organization" : "Organization",
        metrics: { verified: achievement.organization.verified },
      });
    }
    const issuerEdgeId = `${organizationNodeId}->${credentialNodeId}:issued`;
    edges.set(issuerEdgeId, {
      id: issuerEdgeId,
      source: organizationNodeId,
      target: credentialNodeId,
      kind: "issued",
    });
  }

  if (contributorIds.size > 0) {
    nodes.set("people:network", {
      id: "people:network",
      kind: "people",
      label: "Contributor network",
      detail: "Aggregate participation · no personal identifiers shown",
      metrics: { contributors: contributorIds.size },
    });
    for (const [opportunityNodeId, count] of perOpportunityParticipants) {
      const edgeId = `people:network->${opportunityNodeId}:contribution`;
      edges.set(edgeId, {
        id: edgeId,
        source: "people:network",
        target: opportunityNodeId,
        kind: "contribution",
        weight: count,
      });
    }
  }

  if (networkPoints > 0) {
    nodes.set("reputation:network", {
      id: "reputation:network",
      kind: "reputation",
      label: "Verified reputation",
      detail: "Points issued for organization-approved work",
      metrics: { points: networkPoints },
    });
    for (const node of nodes.values()) {
      if (node.kind !== "credential") continue;
      const edgeId = `${node.id}->reputation:network:earns`;
      edges.set(edgeId, {
        id: edgeId,
        source: node.id,
        target: "reputation:network",
        kind: "earns",
      });
    }
  }

  return {
    nodes: [...nodes.values()],
    edges: [...edges.values()],
    totals: {
      organizations: opportunityOrganizations.length,
      opportunities: opportunityTotal,
      skills: skillIds.size,
      achievements: achievementTotal,
      contributors: contributorIds.size,
      reputationPoints: networkPoints,
    },
    sampled: opportunityTotal > OPPORTUNITY_LIMIT || achievementTotal > ACHIEVEMENT_LIMIT,
  };
}
