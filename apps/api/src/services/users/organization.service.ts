import { prisma } from "../../config/database";
import { ConflictError, NotFoundError } from "../../utils/errors";
import { slugify } from "../../utils/slugify";

export async function listOrganizations(input: {
  page: number;
  pageSize: number;
  q?: string;
}) {
  const where = input.q
    ? { name: { contains: input.q, mode: "insensitive" as const } }
    : {};
  const [items, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.organization.count({ where }),
  ]);
  return { items, total };
}

export async function getOrganizationById(id: string) {
  const organization = await prisma.organization.findUnique({ where: { id } });
  if (!organization) throw new NotFoundError("Organization not found");
  return organization;
}

export async function createOrganization(input: {
  name: string;
  type?: string;
  countryCode?: string;
  website?: string;
  description?: string;
}) {
  const slug = slugify(input.name);
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) throw new ConflictError("An organization with this name already exists");

  return prisma.organization.create({
    data: {
      name: input.name,
      slug,
      type: (input.type ?? null) as never,
      countryCode: input.countryCode ?? null,
      website: input.website ?? null,
      description: input.description ?? null,
    },
  });
}

export async function updateOrganization(
  id: string,
  patch: {
    name?: string;
    type?: string;
    countryCode?: string;
    website?: string;
    description?: string;
    logoUrl?: string;
  },
) {
  await getOrganizationById(id);
  return prisma.organization.update({
    where: { id },
    data: {
      name: patch.name,
      type: (patch.type ?? undefined) as never,
      countryCode: patch.countryCode,
      website: patch.website,
      description: patch.description,
      logoUrl: patch.logoUrl,
    },
  });
}