import { env } from "../config/env";
import { http } from "./http";

export const mediaService = {
  async uploadImage(file: File): Promise<string> {
    const result = await http<{ id: string }>("/media/images", {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const apiBase = `${env.apiUrl.replace(/\/+$/, "")}/`;
    return new URL(`media/images/${result.id}`, new URL(apiBase, window.location.origin)).toString();
  },
};
