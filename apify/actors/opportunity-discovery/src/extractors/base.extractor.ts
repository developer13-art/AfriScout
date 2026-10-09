import { load, type CheerioAPI } from "cheerio";

export abstract class BaseExtractor {
  load(html: string): CheerioAPI {
    return load(html);
  }
}