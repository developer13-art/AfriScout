export function extractOrganization(text: string): string | null {
  const match = text.match(/([A-Z][A-Za-z&.\-]+(?:\s+[A-Z][A-Za-z&.\-]+){0,6})\s+(?:Ltd|Limited|LLC|Plc|Foundation|Agency|Authority|Ministry|Commission|University)/);
  return match ? match[0].trim() : null;
}