export interface BusinessProfile {
  id: string;
  userId: string;
  companyName: string;
  registrationNumber?: string | null;
  industry?: string | null;
  employeesCount?: number | null;
  annualRevenue?: number | null;
  annualRevenueCurrency?: string | null;
  website?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCapability {
  id: string;
  businessProfileId: string;
  capability: string;
  strength?: number | null;
  createdAt: string;
}