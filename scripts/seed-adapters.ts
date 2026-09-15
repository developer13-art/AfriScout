import { prisma } from "../apps/api/src/config/database";

const ADAPTERS = [
  { key: "government",          label: "Government",                 description: "Government agency listing pages with per-item detail pages." },
  { key: "procurementPortal",   label: "Procurement Portal",         description: "Procurement portals with tender listings and pagination." },
  { key: "university",          label: "University",                 description: "University opportunity and scholarship listings." },
  { key: "ngo",                 label: "NGO",                        description: "NGO opportunity and program listings." },
  { key: "foundation",          label: "Foundation",                 description: "Foundation grant and program listings." },
  { key: "accelerator",         label: "Accelerator",                description: "Accelerator and incubator program pages." },
  { key: "grantPortal",         label: "Grant Portal",               description: "Dedicated grant listing portals." },
  { key: "jobBoard",            label: "Job Board",                  description: "Job boards with structured role listings." },
  { key: "scholarshipPortal",   label: "Scholarship Portal",         description: "Scholarship listing portals with per-item detail pages." },
  { key: "genericListing",      label: "Generic Listing",            description: "Fallback adapter for standard listing + detail pages." },
  { key: "genericRss",          label: "Generic RSS",                description: "RSS or Atom feed of opportunities." },
  { key: "genericSitemap",      label: "Generic Sitemap",            description: "Sitemap-driven discovery for sites without an index page." },
];

async function main() {
  for (const adapter of ADAPTERS) {
    await prisma.sourceAdapter.upsert({
      where: { key: adapter.key },
      update: { label: adapter.label, description: adapter.description, version: "1.0.0" },
      create: { key: adapter.key, label: adapter.label, description: adapter.description, version: "1.0.0" },
    });
    console.log("upserted", adapter.key);
  }
  console.log("done");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});