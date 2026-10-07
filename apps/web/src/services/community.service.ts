import { http } from "./http";

export type CommunityKind =
  | "GENERAL"
  | "OPPORTUNITY_DISCUSSION"
  | "QUESTION"
  | "ACHIEVEMENT"
  | "PROJECT_ANNOUNCEMENT"
  | "EDUCATIONAL"
  | "INDUSTRY_DISCUSSION";

export interface CommunityPerson {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  countryCode: string | null;
  username?: string | null;
  headline?: string | null;
  shared: string[];
  score: number;
  category: string;
  explanation: string;
}

export interface CommunityMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  countryCode: string | null;
  username: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[];
  interests: string[];
  following: boolean;
}

export interface CommunitySpace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  countryCode: string | null;
  topics: string[];
  postCount: number;
  memberCount: number;
  following: boolean;
}

export interface CommunitySettings {
  visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
  analyzable: boolean;
  connectionPolicy: "ANYONE" | "FOLLOWERS" | "NOBODY";
  blocked: Array<{ id: string; fullName: string; avatarUrl: string | null }>;
  muted: Array<{ id: string; fullName: string; avatarUrl: string | null }>;
}

export interface CommunityConnectionRequest {
  id: string;
  status: "PENDING";
  createdAt: string;
  direction: "sent" | "received";
  person: CommunityAuthor;
}

export interface CommunityAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  countryCode: string | null;
  profile?: { username: string | null; headline: string | null };
  professionalProfile?: { profession: string | null; skills: string[] };
}

export interface CommunityPost {
  id: string;
  content: string;
  kind: CommunityKind;
  createdAt: string;
  likedByMe: boolean;
  followingByMe: boolean;
  author: CommunityAuthor;
  opportunity: { id: string; slug: string; title: string; category: string; deadline?: string | null } | null;
  comments: Array<{ id: string; content: string; author: CommunityAuthor; createdAt: string }>;
  _count: { comments: number; reactions: number };
}

export interface CommunityOpportunity {
  id: string;
  slug: string;
  title: string;
  category: string;
  deadline: string | null;
}

export interface CommunityPublicProfile extends CommunityMember {
  industries: string[];
  languages: string[];
  stats: { posts: number; followers: number; following: number; completed: number };
  recentPosts: Array<{
    id: string;
    content: string;
    kind: CommunityKind;
    createdAt: string;
    opportunity: CommunityOpportunity | null;
    _count: { comments: number; reactions: number };
  }>;
}

export const communityService = {
  feed: (tab: string, group?: string) => http<CommunityPost[]>("/community/feed", { query: { tab, group: group || undefined } }),
  searchOpportunities: (q: string) => http<CommunityOpportunity[]>("/community/opportunities/search", { query: { q } }),
  opportunityInteractionSummary: (id: string) => http<{ counts: Record<string, number>; mine: string[] }>(`/community/opportunities/${id}/interactions`),
  interactWithOpportunity: (id: string, kind: "INTERESTED" | "APPLYING" | "COMPLETED") =>
    http<{ active: boolean }>(`/community/opportunities/${id}/interactions`, { method: "POST", body: JSON.stringify({ kind }) }),
  members: (q = "") => http<CommunityMember[]>("/community/members", { query: { q: q || undefined } }),
  spaces: () => http<CommunitySpace[]>("/community/spaces"),
  followSpace: (slug: string) => http<{ following: boolean }>(`/community/spaces/${encodeURIComponent(slug)}/follow`, { method: "POST" }),
  connectionRequests: () => http<CommunityConnectionRequest[]>("/community/connection-requests"),
  acceptedConnections: () => http<Array<{ id: string; connectedAt: string; person: CommunityAuthor }>>("/community/connections/list"),
  requestConnection: (userId: string) => http<{ id: string; status: string }>(`/community/connections/${userId}`, { method: "POST" }),
  respondToConnection: (id: string, status: "ACCEPTED" | "DECLINED") =>
    http<{ status: string }>(`/community/connection-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  settings: () => http<CommunitySettings>("/community/settings"),
  updateSettings: (settings: Partial<Pick<CommunitySettings, "visibility" | "analyzable" | "connectionPolicy">>) =>
    http<CommunitySettings>("/community/settings", { method: "PATCH", body: JSON.stringify(settings) }),
  analyzeProfile: () => http<{ id: string; provider: string | null; result: Record<string, unknown>; createdAt: string }>("/community/profile-analysis", { method: "POST" }),
  profile: (userId: string) => http<CommunityPublicProfile>(`/community/profile/${userId}`),
  comments: (postId: string) =>
    http<CommunityPost["comments"]>(`/community/posts/${postId}/comments`),
  connections: () => http<CommunityPerson[]>("/community/connections"),
  createPost: (content: string, kind: CommunityKind, opportunityId?: string) =>
    http<CommunityPost>("/community/posts", { method: "POST", body: JSON.stringify({ content, kind, opportunityId }) }),
  react: (postId: string) =>
    http<{ liked: boolean }>(`/community/posts/${postId}/reaction`, { method: "POST" }),
  comment: (postId: string, content: string) =>
    http<CommunityPost["comments"][number]>(`/community/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  follow: (userId: string) =>
    http<{ following: boolean }>(`/community/follows/${userId}`, { method: "POST" }),
  followTarget: (targetType: "ORGANIZATION" | "INDUSTRY" | "TOPIC" | "OPPORTUNITY" | "COUNTRY", targetKey: string) =>
    http<{ following: boolean }>("/community/follows", {
      method: "POST",
      body: JSON.stringify({ targetType, targetKey }),
    }),
  report: (input: { postId?: string; commentId?: string; reportedUserId?: string; reason: string; details?: string }) =>
    http<{ id: string; status: string }>("/community/reports", { method: "POST", body: JSON.stringify(input) }),
  userAction: (userId: string, kind: "BLOCK" | "MUTE") =>
    http<{ active: boolean }>(`/community/users/${userId}/actions`, {
      method: "POST",
      body: JSON.stringify({ kind }),
    }),
};
