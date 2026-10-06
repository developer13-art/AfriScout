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
  opportunity: { slug: string; title: string; category: string } | null;
  comments: Array<{ id: string; content: string; author: CommunityAuthor; createdAt: string }>;
  _count: { comments: number; reactions: number };
}

export const communityService = {
  feed: (tab: string) => http<CommunityPost[]>("/community/feed", { query: { tab } }),
  comments: (postId: string) =>
    http<CommunityPost["comments"]>(`/community/posts/${postId}/comments`),
  connections: () => http<CommunityPerson[]>("/community/connections"),
  createPost: (content: string, kind: CommunityKind) =>
    http<CommunityPost>("/community/posts", { method: "POST", body: JSON.stringify({ content, kind }) }),
  react: (postId: string) =>
    http<{ liked: boolean }>(`/community/posts/${postId}/reaction`, { method: "POST" }),
  comment: (postId: string, content: string) =>
    http<CommunityPost["comments"][number]>(`/community/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  follow: (userId: string) =>
    http<{ following: boolean }>(`/community/follows/${userId}`, { method: "POST" }),
  report: (input: { postId?: string; reportedUserId?: string; reason: string }) =>
    http<{ id: string; status: string }>("/community/reports", { method: "POST", body: JSON.stringify(input) }),
  userAction: (userId: string, kind: "BLOCK" | "MUTE") =>
    http<{ active: boolean }>(`/community/users/${userId}/actions`, {
      method: "POST",
      body: JSON.stringify({ kind }),
    }),
};
