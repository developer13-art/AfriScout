import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../config/logger";

const SUBCATEGORIES_KEY = "categories.subcategories";

const subcategoriesByCategory: Record<string, string[]> = {
  PROCUREMENT: [
    "Construction",
    "Infrastructure",
    "Equipment",
    "Materials",
    "Logistics",
    "Services",
    "Consultancy",
  ],
  CONTRACTS: [
    "Civil Engineering",
    "Technology",
    "Maintenance",
    "Outsourcing",
    "Professional Services",
  ],
  GRANTS: [
    "Startup",
    "Research",
    "Community",
    "Youth",
    "Women",
    "Climate",
    "Education",
    "Technology",
  ],
  FUNDING: [
    "Venture",
    "Seed",
    "Growth",
    "Innovation",
    "Development",
  ],
  EMPLOYMENT: [
    "Engineering",
    "Software",
    "Data",
    "Operations",
    "Finance",
    "Sales",
    "Marketing",
    "Executive",
  ],
  INTERNSHIPS: ["Technology", "Engineering", "Corporate", "Research"],
  SCHOLARSHIPS: ["Undergraduate", "Postgraduate", "STEM", "Research", "International"],
  FELLOWSHIPS: ["Leadership", "Research", "Technology", "Entrepreneurship"],
  ACCELERATORS: ["Fintech", "Healthtech", "Agritech", "Generalist"],
  INCUBATORS: ["Generalist", "Sector-specific"],
  COMPETITIONS: ["Startup", "Innovation", "Hackathon", "Student"],
  TRAINING: ["Digital Skills", "Entrepreneurship", "Certifications", "Bootcamps"],
  RESEARCH: ["Academic", "Applied", "Collaboration"],
  PARTNERSHIPS: ["Business", "Technology", "Distribution", "Strategic"],
  INVESTMENT: ["Angel", "Venture", "Corporate"],
  DEVELOPMENT: ["NGO", "Social Impact", "Community"],
  OTHER: [],
};

export async function seedSubcategories(prisma: PrismaClient): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: SUBCATEGORIES_KEY },
    update: { value: subcategoriesByCategory },
    create: {
      key: SUBCATEGORIES_KEY,
      value: subcategoriesByCategory,
      description: "Subcategories per opportunity category",
    },
  });
  logger.info("subcategories_seeded");
}