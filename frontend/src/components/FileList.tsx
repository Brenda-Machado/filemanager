// File Manager - FileList.tsx

import { useState } from "react";
import { filesApi } from "../api/files";
import type { FileRecord } from "../api/files";
import { formatBytes, formatDate, mimeIcon } from "../utils/format";

interface Props {
  files: FileRecord[];
  onDeleted: (id: number) => void;
}

export default function FileList({ files, onDeleted }: Props) {
  const [downloading, setDownloading] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  async function handleDownload(file: FileRecord) {
    setDownloading(file.id);
    try {
      await filesApi.download(file.id, file.original_name);
    } finally {
      setDownloading(null);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await filesApi.delete(id);
      onDeleted(id);
    } catch {
      // keep item visible on error
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  if (files.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p>No files yet</p>
        <span>Upload your first file above</span>
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <span className="col-name">Name</span>
        <span className="col-size">Size</span>
        <span className="col-date">Uploaded</span>
        <span className="col-actions" />
      </div>

      {files.map((file) => (
        <div key={file.id} className="file-row">
          <span className="col-name">
            <span className="file-type-badge">{mimeIcon(file.mime_type)}</span>
            <span className="file-name" title={file.original_name}>
              {file.original_name}
            </span>
          </span>

          <span className="col-size mono">{formatBytes(file.size_bytes)}</span>
          <span className="col-date mono">{formatDate(file.created_at)}</span>

          <span className="col-actions">
            {confirmDelete === file.id ? (
              <span className="confirm-row">
                <span className="confirm-label">Delete?</span>
                <button
                  className="btn-danger-sm"
                  onClick={() => handleDelete(file.id)}
                  disabled={deleting === file.id}
                >
                  {deleting === file.id ? "..." : "Yes"}
                </button>
                <button
                  className="btn-ghost-sm"
                  onClick={() => setConfirmDelete(null)}
                >
                  No
                </button>
              </span>
            ) : (
              <>
                <button
                  className="btn-action"
                  title="Download"
                  onClick={() => handleDownload(file)}
                  disabled={downloading === file.id}
                >
                  {downloading === file.id ? (
                    <span className="spinner-sm" />
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                </button>
                <button
                  className="btn-action btn-action-delete"
                  title="Delete"
                  onClick={() => setConfirmDelete(file.id)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}