import { useState, useEffect } from "react"
import JoinRoom from "./components/JoinRoom"
import TransferRoom from "./components/TransferRoom"
import "./App.css"

function App() {
  const [room, setRoom] = useState(null)

  useEffect(() => {
    // Check if room ID is provided in URL hash or search params
    const params = new URLSearchParams(window.location.search)
    const roomParam = params.get("room") || window.location.hash.replace("#", "")
    if (roomParam) {
      setRoom(roomParam)
    }
  }, [])

  const handleJoin = (roomId) => {
    setRoom(roomId)
    // Update hash for shareable URL without reload
    window.location.hash = roomId
  }

  const handleLeave = () => {
    setRoom(null)
    window.location.hash = ""
    // clean search params if present
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="m12 12 4 4m0 0-4 4m4-4H8" />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="brand-title">Meetmux</span>
              <span className="brand-tag">P2P</span>
            </div>
          </div>
        </div>

        {room && (
          <div className="header-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleLeave}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Leave Room
            </button>
          </div>
        )}
      </header>

      <main>
        {room ? (
          <TransferRoom roomId={room} onLeave={handleLeave} />
        ) : (
          <JoinRoom onJoin={handleJoin} />
        )}
      </main>
    </div>
  )
}

export default App
