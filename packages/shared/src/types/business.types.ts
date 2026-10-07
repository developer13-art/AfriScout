export interface BusinessProfileDTO {
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
}