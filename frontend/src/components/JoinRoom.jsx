import { useState } from "react"

function JoinRoom({ onJoin }) {
  const [val, setVal] = useState("")

  function handleJoin() {
    const id = val.trim()
    if (!id) return alert("Please enter a room ID")
    onJoin(id)
  }

  function handleCreateInstant() {
    // Generate a clean, random memorable room ID like mux-7842
    const randomCode = "mux-" + Math.floor(1000 + Math.random() * 9000)
    onJoin(randomCode)
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#818cf8" }}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Connect & Transfer
        </h2>
        <p className="card-subtitle">
          Direct peer-to-peer file sharing between browsers. Files stream in real-time with zero server storage.
        </p>

        <div style={{ marginBottom: "20px" }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "14px" }}
            onClick={handleCreateInstant}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Instant Room
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0", color: "var(--text-dim)", fontSize: "0.8rem" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }}></div>
          <span>OR ENTER CODE</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }}></div>
        </div>

        <div className="input-group">
          <input
            type="text"
            className="input-field"
            placeholder="Enter Room Code (e.g. mux-4819)"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <button className="btn btn-secondary" onClick={handleJoin}>
            Join Room
          </button>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-item">
          <h3>⚡ WebRTC P2P</h3>
          <p>Direct peer connections with ultra-low latency & maximum throughput.</p>
        </div>
        <div className="feature-item">
          <h3>🔒 Zero Storage</h3>
          <p>Transfers are ephemeral. Files never touch any server disk or cloud database.</p>
        </div>
        <div className="feature-item">
          <h3>🛡️ SHA-256 Check</h3>
          <p>Every file chunk is cryptographically hashed and verified on receipt.</p>
        </div>
      </div>
    </div>
  )
}

export default JoinRoom
