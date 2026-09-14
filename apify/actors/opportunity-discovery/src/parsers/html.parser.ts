import { load, type CheerioAPI } from "cheerio";

export function parseHtml(html: string): CheerioAPI {
  return load(html);
}

export function textFrom(html: string, selector: string): string | null {
  const $ = parseHtml(html);
  const text = $(selector).first().text().replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : null;
}