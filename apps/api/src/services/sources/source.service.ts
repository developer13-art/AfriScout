import { prisma } from "../../config/database";
import { ConflictError, NotFoundError } from "../../utils/errors";
import { slugify, ensureUniqueSlug } from "../../utils/slugify";
import type {
  SourceCreateInput,
  SourceFilterInput,
  SourceUpdateInput,
} from "../../validators/source.validator";

export async function listSources(input: SourceFilterInput) {
  const page = input.page ?? 1;
  const pageSize = Math.min(input.pageSize ?? 20, 100);
  const where = buildWhere(input);

  const [items, total] = await Promise.all([
    prisma.source.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.source.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getSourceById(id: string) {
  const source = await prisma.source.findUnique({ where: { id } });
  if (!source) throw new NotFoundError("Source not found");
  return source;
}

export async function createSource(
  input: SourceCreateInput,
  createdBy: string | null,
) {
  const slug = await generateSourceSlug(input.name);

  return prisma.source.create({
    data: {
      name: input.name,
      slug,
      url: input.url,
      adapter: input.adapter,
      countryCode: input.countryCode ?? null,
      region: input.region ?? null,
      language: input.language ?? null,
      currency: input.currency ?? null,
      category: input.category ?? null,
      sourceType: input.sourceType,
      crawlFrequency: input.crawlFrequency ?? "DAILY",
      attributionRequired: input.attributionRequired ?? true,
      termsUrl: input.termsUrl ?? null,
      notes: input.notes ?? null,
      metadata: (input.metadata ?? {}) as never,
      active: input.active ?? false,
      createdBy,
    },
  });
}

export async function updateSource(id: string, patch: SourceUpdateInput) {
  await getSourceById(id);
  return prisma.source.update({
    where: { id },
    data: {
      name: patch.name,
      url: patch.url,
      adapter: patch.adapter,
      countryCode: patch.countryCode,
      region: patch.region,
      language: patch.language,
      currency: patch.currency,
      category: patch.category,
      sourceType: patch.sourceType,
      crawlFrequency: patch.crawlFrequency,
      attributionRequired: patch.attributionRequired,
      termsUrl: patch.termsUrl,
      notes: patch.notes,
      metadata: (patch.metadata ?? undefined) as never,
      active: patch.active,
    },
  });
}

export async function activateSource(id: string) {
  await getSourceById(id);
  return prisma.source.update({
    where: { id },
    data: { active: true, health: "UNKNOWN" },
  });
}

export async function deactivateSource(id: string) {
  await getSourceById(id);
  return prisma.source.update({
    where: { id },
    data: { active: false, health: "INACTIVE" },
  });
}

async function generateSourceSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;
  while (await prisma.source.findUnique({ where: { slug: candidate } })) {
    candidate = ensureUniqueSlug(base, ++suffix);
    if (suffix > 500) throw new ConflictError("Unable to generate a unique slug");
  }
  return candidate;
}

function buildWhere(input: SourceFilterInput) {
  const where: Record<string, unknown> = {};
  if (input.q) {
    where.OR = [
      { name: { contains: input.q, mode: "insensitive" } },
      { url: { contains: input.q, mode: "insensitive" } },
    ];
  }
  if (input.countryCode) where.countryCode = input.countryCode;
  if (input.category) where.category = input.category;
  if (input.sourceType) where.sourceType = input.sourceType;
  if (input.health) where.health = input.health;
  if (typeof input.active === "boolean") where.active = input.active;
  if (input.crawlFrequency) where.crawlFrequency = input.crawlFrequency;
  return where;
}