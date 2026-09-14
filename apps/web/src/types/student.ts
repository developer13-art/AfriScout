export interface StudentProfile {
  id: string;
  userId: string;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  institution?: string | null;
  graduationYear?: number | null;
  interests: string[];
  createdAt: string;
  updatedAt: string;
}