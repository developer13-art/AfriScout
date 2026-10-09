import { http } from "./http";

export const mediaService = {
  async uploadImage(file: File): Promise<string> {
    const result = await http<{ data: { id: string } }>("/media/images", {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    return `/api/v1/media/images/${result.data.id}`;
  },
  async uploadAttachment(file: File): Promise<CommunityAttachment> {
    return http<CommunityAttachment>("/media/attachments", {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
      },
      body: file,
    });
  },
  downloadAttachment(id: string): Promise<Blob> {
    return http<Blob>(`/media/attachments/${encodeURIComponent(id)}`, {
      responseType: "blob",
    });
  },
};

export interface CommunityAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}
