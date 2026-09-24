function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function ReceivedFiles({ files }) {
  return (
    <div>
      {files.map((file, i) => (
        <div className="received-file" key={i}>
          <a href={file.url} download={file.name}>{file.name}</a>
          <span className="file-meta">
            {formatSize(file.size)} — {file.verified ? "✅ Verified" : "⚠️ Hash mismatch"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default ReceivedFiles;
