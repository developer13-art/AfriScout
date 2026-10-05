import { load } from "cheerio";

export function parseHtmlDocument(html: string): string {
  const $ = load(html);
  $("script, style, noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}