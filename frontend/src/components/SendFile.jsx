import { useRef, useState } from "react";

function SendFile({ onSend }) {
  const fileRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  async function handleSend() {
    const file = fileRef.current?.files[0];
    if (!file) return alert("Pick a file first.");

    setSending(true);
    setDone(false);
    setProgress(0);

    const arrayBuffer = await file.arrayBuffer();
    const CHUNK_SIZE = 64 * 1024;

    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await onSend(file);

    setProgress(100);
    setSending(false);
    setDone(true);
  }

  return (
    <div>
      <h2>Send a File</h2>
      <input type="file" ref={fileRef} />
      <button onClick={handleSend} disabled={sending}>
        {sending ? "Sending..." : "Send File"}
      </button>

      {sending && (
        <div>
          <p className="progress-label">Sending...</p>
          <progress value={progress} max="100" />
        </div>
      )}

      {done && <p className="progress-label" style={{ color: "green" }}>✅ File sent!</p>}
    </div>
  );
}

export default SendFile;
