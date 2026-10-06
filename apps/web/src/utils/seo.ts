export interface SeoMeta {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
}

export function buildSeoTitle(page: string, appName = "AfriScout"): string {
  return page ? `${page} | ${appName}` : appName;
}

export function applySeo(meta: SeoMeta): void {
  if (typeof document === "undefined") return;
  document.title = meta.title;
  if (meta.description) {
    setMeta("description", meta.description);
    setMeta("og:description", meta.description);
    setMeta("twitter:description", meta.description);
  }
  setMeta("og:title", meta.title);
  setMeta("twitter:title", meta.title);
  if (meta.image) {
    setMeta("og:image", meta.image);
    setMeta("twitter:image", meta.image);
  }
  if (meta.url) {
    setMeta("og:url", meta.url);
  }
  if (meta.type) {
    setMeta("og:type", meta.type);
  }
}

function setMeta(name: string, content: string): void {
  const selector = name.startsWith("og:") || name.startsWith("twitter:")
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    if (name.startsWith("og:") || name.startsWith("twitter:")) {
      tag.setAttribute("property", name);
    } else {
      tag.setAttribute("name", name);
    }
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}