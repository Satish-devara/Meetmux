import { useState } from "react";
import JoinRoom from "./components/JoinRoom";
import TransferRoom from "./components/TransferRoom";
import "./App.css";

function App() {
  const [roomId, setRoomId] = useState(null);

  return (
    <div className="app">
      <h1>P2P File Transfer</h1>
      <p className="subtitle">Files go directly browser-to-browser. Nothing is stored on any server.</p>

      {!roomId ? (
        <JoinRoom onJoin={(id) => setRoomId(id)} />
      ) : (
        <TransferRoom roomId={roomId} />
      )}
    </div>
  );
}

export default App;
