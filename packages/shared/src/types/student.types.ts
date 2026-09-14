export interface StudentProfileDTO {
  id: string;
  userId: string;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  institution?: string | null;
  graduationYear?: number | null;
  interests: string[];
}