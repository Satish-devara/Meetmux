import { useRef, useState } from "react"

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

function SendFile({ onSend }) {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [sentSuccess, setSentSuccess] = useState(false)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setSentSuccess(false)
      setProgress(0)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setSentSuccess(false)
      setProgress(0)
    }
  }

  const handleSend = async () => {
    if (!selectedFile) return
    setSending(true)
    setSentSuccess(false)
    setProgress(0)

    try {
      await onSend(selectedFile, (pct) => {
        setProgress(pct)
      })
      setSentSuccess(true)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      console.error("Failed to send file:", err)
      alert("Transfer failed. Please check connection.")
    } finally {
      setSending(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setSentSuccess(false)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div>
      <h2 className="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#818cf8" }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Send a File
      </h2>
      <p className="card-subtitle">
        Drop any file below to stream directly to your peer over WebRTC.
      </p>

      {!selectedFile ? (
        <div
          className={`dropzone ${isDragOver ? "drag-active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="file-input-hidden"
          />
          <div className="dropzone-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className="dropzone-text">Click to browse or drag file here</div>
          <div className="dropzone-sub">Any file format • Direct peer stream</div>
        </div>
      ) : (
        <div>
          <div className="selected-file-box">
            <div className="file-info-left">
              <div className="file-type-icon">
                {getFileExtension(selectedFile.name)}
              </div>
              <div className="file-name-size">
                <div className="file-title">{selectedFile.name}</div>
                <div className="file-bytes">{formatFileSize(selectedFile.size)}</div>
              </div>
            </div>

            {!sending && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClear}
                title="Remove file"
              >
                ✕ Change
              </button>
            )}
          </div>

          {sending && (
            <div className="progress-container">
              <div className="progress-header">
                <span>Sending chunks...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "16px" }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", padding: "13px" }}
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Sending ({progress}%)...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Send File Directly
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {sentSuccess && (
        <div className="transfer-complete-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Delivered! Verified by remote peer.
        </div>
      )}
    </div>
  )
}

export default SendFile
