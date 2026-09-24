function getSize(bytes) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function ReceivedFiles({ files }) {
  return (
    <div>
      {files.map((f, i) => (
        <div className="received-file" key={i}>
          <a href={f.url} download={f.name}>{f.name}</a>
          <span className="file-meta">
            {getSize(f.size)} — {f.ok ? "✅ verified" : "⚠️ hash mismatch"}
          </span>
        </div>
      ))}
    </div>
  )
}

export default ReceivedFiles
