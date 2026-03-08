// File Manager - DashboardPage.tsx

import { useEffect, useState } from "react";
import { filesApi } from "../api/files";
import type { FileRecord } from "../api/files";
import { useAuth } from "../context/AuthContext";
import FileList from "../components/FileList";
import UploadZone from "../components/UploadZone";
import { getApiError } from "../utils/error";

export default function DashboardPage() {
  const { email, logout } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFiles() {
    setLoading(true);
    setError("");
    try {
      const data = await filesApi.list();
      setFiles(data);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  function handleUploaded(file: FileRecord) {
    setFiles((prev) => [file, ...prev]);
  }

  function handleDeleted(id: number) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-mark">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
</span>
          <span className="brand-name">File Manager</span>
        </div>
        <div className="topbar-user">
          <span className="user-email">{email}</span>
          <button className="btn-logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="upload-section">
          <h2 className="section-title">Upload</h2>
          <UploadZone onUploaded={handleUploaded} />
        </section>

        <section className="files-section">
          <div className="files-header">
            <h2 className="section-title">My files</h2>
            {!loading && (
              <span className="file-count">
                {files.length} {files.length === 1 ? "file" : "files"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loader" />
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button className="btn-ghost" onClick={loadFiles}>Retry</button>
            </div>
          ) : (
            <FileList files={files} onDeleted={handleDeleted} />
          )}
        </section>
      </main>
    </div>
  );
}