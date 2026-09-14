import { create } from "zustand";
import type { UserProfile } from "../types/user";
import type { BusinessProfile } from "../types/business";
import type { StudentProfile } from "../types/student";

interface UserState {
  profile: UserProfile | null;
  business: BusinessProfile | null;
  student: StudentProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  setBusiness: (business: BusinessProfile | null) => void;
  setStudent: (student: StudentProfile | null) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  business: null,
  student: null,
  setProfile: (profile) => set({ profile }),
  setBusiness: (business) => set({ business }),
  setStudent: (student) => set({ student }),
  reset: () => set({ profile: null, business: null, student: null }),
}));