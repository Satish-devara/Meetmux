import { useState } from "react";

function JoinRoom({ onJoin }) {
  const [value, setValue] = useState("");

  function handleJoin() {
    const id = value.trim();
    if (!id) return alert("Please enter a room ID.");
    onJoin(id);
  }

  return (
    <div className="card">
      <h2>Join a Room</h2>
      <p>Share the same Room ID with the person you want to transfer files with.</p>
      <input
        type="text"
        placeholder="Enter Room ID (e.g. abc123)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
      />
      <button onClick={handleJoin}>Join Room</button>
    </div>
  );
}

export default JoinRoom;
