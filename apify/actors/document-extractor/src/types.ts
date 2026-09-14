export interface ActorInput {
  documentUrl: string;
  mimeType?: string;
  language?: string;
}

export interface ExtractedFields {
  eligibility: string;
  requirements: string[];
  documents: string[];
  value: string;
  deadline: string;
  notes: string;
}