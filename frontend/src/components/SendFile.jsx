import { useRef, useState } from "react"

function SendFile({ onSend }) {
  const fileRef = useRef(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function handleClick() {
    let file = fileRef.current?.files[0]
    if (!file) {
      alert("pick a file first")
      return
    }

    setSending(true)
    setDone(false)
    await onSend(file)
    setSending(false)
    setDone(true)
  }

  return (
    <div>
      <h2>Send a File</h2>
      <input type="file" ref={fileRef} />
      <button onClick={handleClick} disabled={sending}>
        {sending ? "sending..." : "Send"}
      </button>
      {done && <p style={{ marginTop: "10px", color: "green" }}>sent!</p>}
    </div>
  )
}

export default SendFile
