// File Manager - format.ts

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const MIME_LABELS: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
  "application/pdf": "PDF",
  "text/plain": "TXT",
  "text/csv": "CSV",
};

export function mimeIcon(mime: string): string {
  return MIME_LABELS[mime] ?? mime.split("/")[1]?.toUpperCase() ?? "FILE";
}