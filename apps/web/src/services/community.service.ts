import { http } from "./http";
import type { CommunityAttachment } from "./media.service";

export type CommunityKind =
  | "GENERAL"
  | "ANNOUNCEMENT"
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
  category: string;
  purpose: string;
  visibility: "PUBLIC" | "PRIVATE" | "HIDDEN";
  countryCode: string | null;
  language: string;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  topics: string[];
  joinQuestions?: string[];
  postCount: number;
  memberCount: number;
  following: boolean;
  membershipStatus: "ACTIVE" | "PENDING" | "MUTED" | "SUSPENDED" | "BANNED" | null;
  createdAt?: string;
}

export interface CommunitySpaceDetail extends CommunitySpace {
  id: string;
  createdAt: string;
  role: "OWNER" | "ADMIN" | "MODERATOR" | "CONTRIBUTOR" | "MEMBER" | null;
  members: Array<{ id: string; fullName: string; avatarUrl: string | null }>;
  posts: CommunityPost[];
}

export interface CommunitySpaceEvent {
  id: string;
  title: string;
  description: string;
  kind: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  location: string | null;
  meetingUrl: string | null;
  capacity: number | null;
  status: "SCHEDULED" | "CANCELLED" | "COMPLETED";
  going: number;
  interested: number;
  myRsvp: "GOING" | "INTERESTED" | null;
  creator: Pick<CommunityAuthor, "id" | "fullName" | "avatarUrl">;
}

export interface CommunitySpaceProject {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  skillsNeeded: string[];
  memberCount: number;
  joined: boolean;
  creatorId: string;
  creator: Pick<CommunityAuthor, "id" | "fullName" | "avatarUrl">;
  members: Array<{ id: string; userId: string; role: string; user?: Pick<CommunityAuthor, "id" | "fullName" | "avatarUrl"> }>;
}

export interface CommunitySpaceInvite {
  id: string;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  approvalRequired: boolean;
  createdAt: string;
}

export interface CommunitySpaceReport {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: Pick<CommunityAuthor, "id" | "fullName" | "avatarUrl">;
  post: { id: string; content: string; removedAt: string | null; lockedAt: string | null; author: { id: string; fullName: string } } | null;
  comment: { id: string; content: string; removedAt: string | null; postId: string; author: { id: string; fullName: string } } | null;
}

export interface CommunityGroupAchievement {
  id: string;
  title: string;
  description: string | null;
  issuedAt: string;
  points: number;
  user: Pick<CommunityAuthor, "id" | "fullName" | "avatarUrl">;
  opportunity: { id: string; slug: string; title: string };
  organization: { id: string; name: string };
}

export interface CommunitySpaceMember extends CommunityAuthor {
  role: "OWNER" | "ADMIN" | "MODERATOR" | "CONTRIBUTOR" | "MEMBER";
  status: "ACTIVE" | "PENDING" | "MUTED" | "SUSPENDED" | "BANNED";
  joinAnswers?: string[] | null;
  professionalProfile?: { profession: string | null; skills: string[] };
  profile?: { username: string | null; headline: string | null; interests: string[]; industries: string[] };
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

export interface CommunityConversationSummary {
  id: string | null;
  person: CommunityAuthor;
  connectedAt: string;
  lastMessage: { id: string; body: string; senderId: string; createdAt: string; attachments?: CommunityAttachment[] } | null;
  unreadCount: number;
}

export interface CommunityDirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  attachments: CommunityAttachment[];
}

export interface CommunityConversationDetail {
  conversationId: string | null;
  person: CommunityAuthor;
  messages: CommunityDirectMessage[];
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
  attachments: CommunityAttachment[];
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
  coverImageUrl?: string | null;
  industries: string[];
  languages: string[];
  stats: { posts: number; followers: number; following: number; completed: number; connections?: number };
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
  recommendedSpaces: () => http<Array<CommunitySpace & { relevance: number; reasons: string[] }>>("/community/groups/recommended"),
  space: (slug: string) => http<CommunitySpaceDetail>(`/community/spaces/${encodeURIComponent(slug)}`),
  updateSpace: (slug: string, input: Partial<Pick<CommunitySpace, "name" | "description" | "category" | "purpose" | "visibility" | "countryCode" | "language" | "profileImageUrl" | "coverImageUrl" | "topics" | "joinQuestions">>) =>
    http<{ id: string; name: string; slug: string }>(`/community/spaces/${encodeURIComponent(slug)}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteSpace: (slug: string) =>
    http<void>(`/community/spaces/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  transferSpaceOwnership: (slug: string, userId: string) =>
    http<{ transferred: boolean }>(`/community/spaces/${encodeURIComponent(slug)}/transfer-ownership`, { method: "POST", body: JSON.stringify({ userId }) }),
  createSpaceInvite: (slug: string, input: { expiresInDays?: number; maxUses?: number; approvalRequired?: boolean }) =>
    http<{ id: string; token: string; expiresAt: string | null; maxUses: number | null; approvalRequired: boolean }>(`/community/spaces/${encodeURIComponent(slug)}/invites`, { method: "POST", body: JSON.stringify(input) }),
  spaceInvites: (slug: string) =>
    http<CommunitySpaceInvite[]>(`/community/spaces/${encodeURIComponent(slug)}/invites`),
  revokeSpaceInvite: (slug: string, inviteId: string) =>
    http<{ revoked: boolean }>(`/community/spaces/${encodeURIComponent(slug)}/invites/${inviteId}`, { method: "DELETE" }),
  spaceReports: (slug: string) =>
    http<CommunitySpaceReport[]>(`/community/spaces/${encodeURIComponent(slug)}/reports`),
  moderateSpaceReport: (slug: string, reportId: string, action: "RESOLVE" | "DISMISS" | "LOCK_POST" | "UNLOCK_POST" | "REMOVE_CONTENT", note?: string) =>
    http<{ updated: boolean }>(`/community/spaces/${encodeURIComponent(slug)}/reports/${reportId}`, { method: "PATCH", body: JSON.stringify({ action, note }) }),
  acceptSpaceInvite: (token: string, answers: string[] = []) =>
    http<{ status: "ACTIVE" | "PENDING"; slug: string }>(`/community/invites/${token}/accept`, { method: "POST", body: JSON.stringify({ answers }) }),
  previewSpaceInvite: (token: string) =>
    http<{ name: string; slug: string; description: string; profileImageUrl: string | null; joinQuestions: string[]; approvalRequired: boolean }>(`/community/invites/${token}`),
  spaceEvents: (slug: string) =>
    http<CommunitySpaceEvent[]>(`/community/spaces/${encodeURIComponent(slug)}/events`),
  createSpaceEvent: (slug: string, input: {
    title: string; description: string; kind: string; startsAt: string; endsAt?: string | null;
    timezone: string; location?: string; meetingUrl?: string; capacity?: number;
  }) => http<CommunitySpaceEvent>(`/community/spaces/${encodeURIComponent(slug)}/events`, { method: "POST", body: JSON.stringify(input) }),
  updateSpaceEvent: (slug: string, eventId: string, input: Partial<Pick<CommunitySpaceEvent, "title" | "description" | "kind" | "startsAt" | "endsAt" | "location" | "meetingUrl" | "capacity" | "status">>) =>
    http<CommunitySpaceEvent>(`/community/spaces/${encodeURIComponent(slug)}/events/${eventId}`, { method: "PATCH", body: JSON.stringify(input) }),
  rsvpSpaceEvent: (slug: string, eventId: string, status: "GOING" | "INTERESTED" | null) =>
    http<{ status: "GOING" | "INTERESTED" | null }>(`/community/spaces/${encodeURIComponent(slug)}/events/${eventId}/rsvp`, { method: "POST", body: JSON.stringify({ status }) }),
  spaceProjects: (slug: string) =>
    http<CommunitySpaceProject[]>(`/community/spaces/${encodeURIComponent(slug)}/projects`),
  spaceAchievements: (slug: string) =>
    http<CommunityGroupAchievement[]>(`/community/spaces/${encodeURIComponent(slug)}/achievements`),
  createSpaceProject: (slug: string, input: { title: string; description: string; skillsNeeded: string[] }) =>
    http<CommunitySpaceProject>(`/community/spaces/${encodeURIComponent(slug)}/projects`, { method: "POST", body: JSON.stringify(input) }),
  updateSpaceProject: (slug: string, projectId: string, input: Partial<Pick<CommunitySpaceProject, "title" | "description" | "skillsNeeded" | "status">>) =>
    http<CommunitySpaceProject>(`/community/spaces/${encodeURIComponent(slug)}/projects/${projectId}`, { method: "PATCH", body: JSON.stringify(input) }),
  joinSpaceProject: (slug: string, projectId: string, role: string) =>
    http<{ joined: boolean }>(`/community/spaces/${encodeURIComponent(slug)}/projects/${projectId}/join`, { method: "POST", body: JSON.stringify({ role }) }),
  leaveSpaceProject: (slug: string, projectId: string) =>
    http<{ joined: boolean }>(`/community/spaces/${encodeURIComponent(slug)}/projects/${projectId}/join`, { method: "DELETE" }),
  spaceMembers: (slug: string, q = "", status?: "ACTIVE" | "PENDING" | "MUTED" | "SUSPENDED" | "BANNED", type?: "DEVELOPERS" | "FOUNDERS" | "STUDENTS" | "RESEARCHERS" | "ORGANIZATIONS" | "CONTRIBUTORS") =>
    http<CommunitySpaceMember[]>(`/community/spaces/${encodeURIComponent(slug)}/members`, { query: { q: q || undefined, status, type } }),
  moderateSpaceMember: (slug: string, userId: string, action: "APPROVE" | "REJECT" | "MUTE" | "UNMUTE" | "SUSPEND" | "UNSUSPEND" | "BAN" | "UNBAN" | "PROMOTE_MODERATOR" | "DEMOTE_MODERATOR" | "PROMOTE_ADMIN" | "DEMOTE_ADMIN" | "PROMOTE_CONTRIBUTOR" | "DEMOTE_CONTRIBUTOR") =>
    http<{ updated: boolean }>(`/community/spaces/${encodeURIComponent(slug)}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),
  createSpace: (input: {
    name: string; slug: string; description: string; category: string; purpose: string;
    visibility: "PUBLIC" | "PRIVATE" | "HIDDEN"; countryCode?: string; language: string;
    profileImageUrl?: string; coverImageUrl?: string; topics: string[]; joinQuestions?: string[];
  }) => http<{ id: string; name: string; slug: string }>("/community/spaces", { method: "POST", body: JSON.stringify(input) }),
  joinSpace: (slug: string, answers: string[] = []) => http<{ status: "ACTIVE" | "PENDING" }>(`/community/spaces/${encodeURIComponent(slug)}/join`, { method: "POST", body: JSON.stringify({ answers }) }),
  leaveSpace: (slug: string) => http<{ status: null }>(`/community/spaces/${encodeURIComponent(slug)}/join`, { method: "DELETE" }),
  connectionRequests: () => http<CommunityConnectionRequest[]>("/community/connection-requests"),
  acceptedConnections: () => http<Array<{ id: string; connectedAt: string; person: CommunityAuthor }>>("/community/connections/list"),
  messageConversations: () => http<CommunityConversationSummary[]>("/community/messages"),
  messages: (peerId: string) => http<CommunityConversationDetail>(`/community/messages/${encodeURIComponent(peerId)}`),
  sendMessage: (peerId: string, body: string, attachments: string[] = []) =>
    http<CommunityDirectMessage>(`/community/messages/${encodeURIComponent(peerId)}`, { method: "POST", body: JSON.stringify({ body, attachments }) }),
  markMessagesRead: (peerId: string) =>
    http<{ updated: number }>(`/community/messages/${encodeURIComponent(peerId)}/read`, { method: "PATCH" }),
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
  createPost: (content: string, kind: CommunityKind, opportunityId?: string, communitySlug?: string, attachments: string[] = []) =>
    http<CommunityPost>("/community/posts", { method: "POST", body: JSON.stringify({ content, kind, opportunityId, communitySlug, attachments }) }),
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
