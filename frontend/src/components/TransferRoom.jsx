import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import SendFile from "./SendFile"
import ReceivedFiles from "./ReceivedFiles"

const CHUNK = 64 * 1024

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function TransferRoom({ roomId, onLeave }) {
  const [status, setStatus] = useState("Connecting to signaling network...")
  const [statusType, setStatusType] = useState("waiting") // "waiting" | "connected" | "disconnected"
  const [ready, setReady] = useState(false)
  const [files, setFiles] = useState([])
  const [receivingProgress, setReceivingProgress] = useState(null)
  const [copied, setCopied] = useState(false)

  const socket = useRef(null)
  const peer = useRef(null)
  const ch = useRef(null)

  const meta = useRef(null)
  const chunks = useRef([])
  const received = useRef(0)

  useEffect(() => {
    let s = io("http://localhost:3001")
    socket.current = s

    s.on("connect", () => {
      s.emit("join-room", roomId)
      setStatus("Waiting for peer to join room...")
      setStatusType("waiting")
    })

    s.on("room-joined", (data) => {
      if (data.total === 1) {
        setStatus("Room ready. Waiting for someone to join...")
        setStatusType("waiting")
      }
    })

    s.on("room-full", () => {
      alert("This room is already full (maximum 2 participants).")
      if (onLeave) onLeave()
    })

    s.on("peer-left", () => {
      setStatus("Peer disconnected from room")
      setStatusType("disconnected")
      setReady(false)
    })

    s.on("start-offer", async () => {
      setStatus("Peer joined. Establishing WebRTC handshake...")
      setStatusType("waiting")
      let pc = makePC(s)
      peer.current = pc

      let channel = pc.createDataChannel("files")
      channel.binaryType = "arraybuffer"
      ch.current = channel

      channel.onopen = () => {
        setStatus("Secured Direct P2P Tunnel Established")
        setStatusType("connected")
        setReady(true)
      }

      channel.onmessage = (e) => gotMessage(e)

      let offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      s.emit("offer", { roomId, offer })
    })

    s.on("offer", async (data) => {
      setStatus("Incoming peer connection. Answering...")
      setStatusType("waiting")
      let pc = makePC(s)
      peer.current = pc

      pc.ondatachannel = (e) => {
        let channel = e.channel
        channel.binaryType = "arraybuffer"
        ch.current = channel

        channel.onopen = () => {
          setStatus("Secured Direct P2P Tunnel Established")
          setStatusType("connected")
          setReady(true)
        }

        channel.onmessage = (e) => gotMessage(e)
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
      let answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      s.emit("answer", { roomId, answer })
    })

    s.on("answer", async (data) => {
      await peer.current.setRemoteDescription(new RTCSessionDescription(data.answer))
    })

    s.on("ice-candidate", async (data) => {
      if (peer.current) {
        await peer.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    })

    return () => {
      s.disconnect()
      if (peer.current) peer.current.close()
    }
  }, [roomId])

  function makePC(s) {
    let pc = new RTCPeerConnection(iceServers)
    pc.onicecandidate = (e) => {
      if (e.candidate) s.emit("ice-candidate", { roomId, candidate: e.candidate })
    }
    return pc
  }

  async function gotMessage(e) {
    if (typeof e.data === "string") {
      meta.current = JSON.parse(e.data)
      chunks.current = []
      received.current = 0
      setReceivingProgress({
        name: meta.current.name,
        size: meta.current.size,
        percent: 0,
        receivedBytes: 0
      })
    } else {
      chunks.current.push(e.data)
      received.current += e.data.byteLength

      if (meta.current && meta.current.size > 0) {
        const pct = Math.min(100, Math.round((received.current / meta.current.size) * 100))
        setReceivingProgress({
          name: meta.current.name,
          size: meta.current.size,
          percent: pct,
          receivedBytes: received.current
        })
      }

      if (received.current >= meta.current.size) {
        let m = meta.current
        let blob = new Blob(chunks.current, { type: m.type })

        let buf = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())
        let hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")

        let ok = hash === m.hash
        let url = URL.createObjectURL(blob)

        setFiles(prev => [{ name: m.name, size: m.size, url, ok }, ...prev])
        setReceivingProgress(null)
      }
    }
  }

  async function sendFile(file, onProgress) {
    let channel = ch.current
    if (!channel || channel.readyState !== "open") {
      alert("Peer connection is not active yet.")
      return false
    }

    let buf = await file.arrayBuffer()
    let hashBuf = await crypto.subtle.digest("SHA-256", buf)
    let hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("")

    channel.send(JSON.stringify({ name: file.name, size: file.size, type: file.type, hash }))

    let offset = 0
    while (offset < buf.byteLength) {
      channel.send(buf.slice(offset, offset + CHUNK))
      offset += CHUNK
      if (onProgress) {
        onProgress(Math.min(100, Math.round((offset / buf.byteLength) * 100)))
      }
      await new Promise(r => setTimeout(r, 0))
    }

    if (onProgress) onProgress(100)
    return true
  }

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#${roomId}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div>
      {/* Status Bar */}
      <div className="status-banner">
        <div className="status-left">
          <div className={`status-indicator ${statusType}`}></div>
          <div>
            <div className="status-text">{status}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="room-badge">
            Room: <strong>{roomId}</strong>
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopyLink}
            title="Copy share link"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ color: "#34d399" }}>Copied!</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Receiving Live Progress Card */}
      {receivingProgress && (
        <div className="card" style={{ borderLeft: "4px solid #6366f1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1.5s infinite" }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>
              Receiving incoming file: {receivingProgress.name}
            </span>
          </div>

          <div className="progress-container">
            <div className="progress-header">
              <span>{formatFileSize(receivingProgress.receivedBytes)} of {formatFileSize(receivingProgress.size)}</span>
              <span>{receivingProgress.percent}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${receivingProgress.percent}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Send File Card */}
      <div className="card">
        <SendFile onSend={sendFile} />
        {!ready && (
          <div style={{ marginTop: "12px", fontSize: "0.8rem", color: "var(--text-dim)" }}>
            ℹ️ Waiting for peer connection. You can select your file now, and send once connected.
          </div>
        )}
      </div>

      {/* Received Files Card */}
      <div className="card">
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#10b981" }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Received Files ({files.length})
        </h2>
        <p className="card-subtitle">
          Directly downloaded and decrypted in your browser session.
        </p>

        <ReceivedFiles files={files} />
      </div>
    </div>
  )
}

export default TransferRoom
