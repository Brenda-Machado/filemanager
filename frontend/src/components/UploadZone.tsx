// File Manager - UploadZone.tsx

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { filesApi } from "../api/files";
import type { FileRecord } from "../api/files";

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".txt", ".csv"];
const MAX_MB = 10;

interface Props {
  onUploaded: (file: FileRecord) => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; name: string }
  | { status: "success"; name: string }
  | { status: "error"; message: string };

export default function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });

  function validateFile(file: File): string | null {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `File exceeds ${MAX_MB} MB limit`;
    }
    if (file.size === 0) {
      return "File is empty";
    }
    return null;
  }

  async function handleFile(file: File) {
    const err = validateFile(file);
    if (err) {
      setUploadState({ status: "error", message: err });
      return;
    }

    setUploadState({ status: "uploading", progress: 0, name: file.name });
    try {
      const record = await filesApi.upload(file, (pct) => {
        setUploadState({ status: "uploading", progress: pct, name: file.name });
      });
      setUploadState({ status: "success", name: file.name });
      onUploaded(record);
      setTimeout(() => setUploadState({ status: "idle" }), 2500);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Upload failed";
      setUploadState({ status: "error", message: msg });
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  const isUploading = uploadState.status === "uploading";

  return (
    <div
      className={`upload-zone ${drag ? "drag-over" : ""} ${isUploading ? "uploading" : ""}`}
      onClick={() => !isUploading && inputRef.current?.click()}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload file"
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={onChange}
        style={{ display: "none" }}
      />

      <div className="upload-content">
        {uploadState.status === "idle" && (
          <>
            <div className="upload-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="upload-label">Drop a file or click to browse</p>
            <p className="upload-hint">
              {ALLOWED_EXTENSIONS.join("  ")} &mdash; max {MAX_MB} MB
            </p>
          </>
        )}

        {uploadState.status === "uploading" && (
          <div className="upload-progress-wrap">
            <p className="upload-progress-name">{uploadState.name}</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadState.progress}%` }} />
            </div>
            <p className="upload-progress-pct">{uploadState.progress}%</p>
          </div>
        )}

        {uploadState.status === "success" && (
          <div className="upload-feedback success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{uploadState.name} uploaded</span>
          </div>
        )}

        {uploadState.status === "error" && (
          <div className="upload-feedback error">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{uploadState.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}