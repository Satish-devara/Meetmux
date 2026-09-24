import { useState } from "react"
import JoinRoom from "./components/JoinRoom"
import TransferRoom from "./components/TransferRoom"
import "./App.css"

function App() {
  const [room, setRoom] = useState(null)

  return (
    <div className="app">
      <h1>P2P File Transfer</h1>
      <p className="subtitle">files go directly between browsers, nothing stored anywhere</p>

      {room ? <TransferRoom roomId={room} /> : <JoinRoom onJoin={setRoom} />}
    </div>
  )
}

export default App
