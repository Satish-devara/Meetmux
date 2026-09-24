import { useState } from "react"

function JoinRoom({ onJoin }) {
  const [val, setVal] = useState("")

  function join() {
    let id = val.trim()
    if (!id) return alert("enter a room id")
    onJoin(id)
  }

  return (
    <div className="card">
      <h2>Join a Room</h2>
      <p>Both people need to enter the same room ID</p>
      <input
        type="text"
        placeholder="room id (e.g. abc123)"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && join()}
      />
      <button onClick={join}>Join</button>
    </div>
  )
}

export default JoinRoom
