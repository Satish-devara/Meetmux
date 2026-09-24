function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function getFileExtension(filename) {
  const parts = filename.split(".")
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE"
}

function ReceivedFiles({ files }) {
  if (!files || files.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto", opacity: 0.5 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <div>No incoming files yet</div>
        <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "4px" }}>
          Files sent by the connected peer will appear here for direct download.
        </p>
      </div>
    )
  }

  return (
    <div className="received-list">
      {files.map((file, idx) => (
        <div className="received-card" key={idx}>
          <div className="file-info-left">
            <div className="file-type-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7" }}>
              {getFileExtension(file.name)}
            </div>
            <div className="file-name-size">
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                <span className="file-title">{file.name}</span>
                {file.ok ? (
                  <span className="verified-pill ok">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    SHA-256 OK
                  </span>
                ) : (
                  <span className="verified-pill error">
                    ⚠ Hash Mismatch
                  </span>
                )}
              </div>
              <div className="file-bytes">{formatFileSize(file.size)}</div>
            </div>
          </div>

          <a
            href={file.url}
            download={file.name}
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </a>
        </div>
      ))}
    </div>
  )
}

export default ReceivedFiles
