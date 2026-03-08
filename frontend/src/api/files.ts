// File Manager - files.ts

import api from "./client";

export interface FileRecord {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export const filesApi = {
  list: (): Promise<FileRecord[]> =>
    api.get<FileRecord[]>("/files/").then((r) => r.data),

  upload: (
    file: File,
    onProgress: (pct: number) => void
  ): Promise<FileRecord> =>
    api
      .post<FileRecord>("/files/upload", toFormData(file), {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data),

  download: async (id: number, filename: string): Promise<void> => {
    const res = await api.get(`/files/${id}/download`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data as Blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  delete: (id: number): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`/files/${id}`).then((r) => r.data),
};

function toFormData(file: File): FormData {
  const fd = new FormData();
  fd.append("file", file);
  return fd;
}
