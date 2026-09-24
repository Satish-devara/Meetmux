import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import SendFile from "./SendFile"
import ReceivedFiles from "./ReceivedFiles"

const CHUNK = 64 * 1024

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
}

function TransferRoom({ roomId }) {
  const [status, setStatus] = useState("connecting...")
  const [ready, setReady] = useState(false)
  const [files, setFiles] = useState([])

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
      setStatus("waiting for other person...")
    })

    s.on("room-joined", (data) => {
      if (data.total === 1) setStatus("you're in. waiting for someone to join...")
    })

    s.on("room-full", () => alert("room is full!"))

    s.on("peer-left", () => {
      setStatus("other person left")
      setReady(false)
    })

    s.on("start-offer", async () => {
      setStatus("someone joined, connecting...")
      let pc = makePC(s)
      peer.current = pc

      let channel = pc.createDataChannel("files")
      channel.binaryType = "arraybuffer"
      ch.current = channel

      channel.onopen = () => {
        setStatus("connected!")
        setReady(true)
      }

      channel.onmessage = (e) => gotMessage(e)

      let offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      s.emit("offer", { roomId, offer })
    })

    s.on("offer", async (data) => {
      setStatus("got offer, connecting...")
      let pc = makePC(s)
      peer.current = pc

      pc.ondatachannel = (e) => {
        let channel = e.channel
        channel.binaryType = "arraybuffer"
        ch.current = channel

        channel.onopen = () => {
          setStatus("connected!")
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

    return () => s.disconnect()
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
    } else {
      chunks.current.push(e.data)
      received.current += e.data.byteLength

      if (received.current >= meta.current.size) {
        let m = meta.current
        let blob = new Blob(chunks.current, { type: m.type })

        let buf = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())
        let hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")

        let ok = hash === m.hash
        let url = URL.createObjectURL(blob)

        setFiles(prev => [...prev, { name: m.name, size: m.size, url, ok }])
      }
    }
  }

  async function sendFile(file) {
    let channel = ch.current
    if (!channel || channel.readyState !== "open") {
      alert("not connected yet")
      return
    }

    let buf = await file.arrayBuffer()
    let hashBuf = await crypto.subtle.digest("SHA-256", buf)
    let hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("")

    channel.send(JSON.stringify({ name: file.name, size: file.size, type: file.type, hash }))

    let offset = 0
    while (offset < buf.byteLength) {
      channel.send(buf.slice(offset, offset + CHUNK))
      offset += CHUNK
      await new Promise(r => setTimeout(r, 0))
    }

    return true
  }

  return (
    <div>
      <div className="status-bar">{status}</div>

      {ready && (
        <div className="card">
          <SendFile onSend={sendFile} />
        </div>
      )}

      <div className="card">
        <h2>Received Files</h2>
        {files.length === 0
          ? <p style={{ color: "#888", fontSize: "0.9rem" }}>nothing received yet</p>
          : <ReceivedFiles files={files} />
        }
      </div>
    </div>
  )
}

export default TransferRoom
