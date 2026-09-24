import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import SendFile from "./SendFile";
import ReceivedFiles from "./ReceivedFiles";

const CHUNK_SIZE = 64 * 1024;

const iceConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function TransferRoom({ roomId }) {
  const [status, setStatus] = useState("Connecting to server...");
  const [connected, setConnected] = useState(false);
  const [isSender, setIsSender] = useState(false);
  const [receivedFiles, setReceivedFiles] = useState([]);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);

  // incoming file state stored in refs (not state, to avoid stale closures)
  const incomingMeta = useRef(null);
  const incomingChunks = useRef([]);
  const incomingSize = useRef(0);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", roomId);
      setStatus("Waiting for the other person to join...");
    });

    socket.on("room-joined", (data) => {
      if (data.total === 1) {
        setStatus("You're in the room. Waiting for the other person...");
      }
    });

    socket.on("room-full", () => {
      alert("Room is full. Only 2 people allowed.");
    });

    socket.on("peer-left", () => {
      setStatus("The other person disconnected.");
      setConnected(false);
    });

    socket.on("start-offer", async () => {
      setStatus("Someone joined! Setting up connection...");
      setIsSender(true);
      const peer = createPeer(socket, roomId);
      peerRef.current = peer;

      const channel = peer.createDataChannel("file-transfer");
      channel.binaryType = "arraybuffer";
      dataChannelRef.current = channel;

      channel.onopen = () => {
        setStatus("Connected! You can now send files.");
        setConnected(true);
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    });

    socket.on("offer", async (data) => {
      setStatus("Connecting...");
      const peer = createPeer(socket, roomId);
      peerRef.current = peer;

      peer.ondatachannel = (event) => {
        const channel = event.channel;
        channel.binaryType = "arraybuffer";
        dataChannelRef.current = channel;
        channel.onopen = () => {
          setStatus("Connected! Ready to receive files.");
          setConnected(true);
        };
        channel.onmessage = (e) => handleIncomingMessage(e);
      };

      await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
    });

    socket.on("answer", async (data) => {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on("ice-candidate", async (data) => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    return () => socket.disconnect();
  }, [roomId]);

  function createPeer(socket, roomId) {
    const peer = new RTCPeerConnection(iceConfig);
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };
    return peer;
  }

  async function handleIncomingMessage(event) {
    if (typeof event.data === "string") {
      incomingMeta.current = JSON.parse(event.data);
      incomingChunks.current = [];
      incomingSize.current = 0;
    } else {
      incomingChunks.current.push(event.data);
      incomingSize.current += event.data.byteLength;

      if (incomingSize.current >= incomingMeta.current.size) {
        const meta = incomingMeta.current;
        const blob = new Blob(incomingChunks.current, { type: meta.type });

        const hashBuffer = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
        const hashHex = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const verified = hashHex === meta.hash;
        const url = URL.createObjectURL(blob);

        setReceivedFiles((prev) => [...prev, { name: meta.name, size: meta.size, url, verified }]);
      }
    }
  }

  async function sendFile(file) {
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== "open") return alert("Not connected yet.");

    const arrayBuffer = await file.arrayBuffer();

    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    channel.send(JSON.stringify({ name: file.name, size: file.size, type: file.type, hash }));

    let offset = 0;
    while (offset < arrayBuffer.byteLength) {
      const chunk = arrayBuffer.slice(offset, offset + CHUNK_SIZE);
      channel.send(chunk);
      offset += chunk.byteLength;
      await new Promise((r) => setTimeout(r, 0));
    }

    return true;
  }

  return (
    <div>
      <div className="status-bar">{status}</div>

      {connected && isSender && (
        <div className="card">
          <SendFile onSend={sendFile} />
        </div>
      )}

      <div className="card">
        <h2>Received Files</h2>
        {receivedFiles.length === 0 ? (
          <p style={{ color: "#888", fontSize: "0.9rem" }}>No files received yet.</p>
        ) : (
          <ReceivedFiles files={receivedFiles} />
        )}
      </div>
    </div>
  );
}

export default TransferRoom;
