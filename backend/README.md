# WebRTC Signaling Server

This is the backend (signaling server) for the Distributed P2P File Transfer project.

## What it does

WebRTC lets two browsers connect directly to each other to transfer files. But before that direct connection happens, the two browsers need to "introduce" themselves — share connection details. That's what this server does. It just passes messages back and forth between two peers until they can connect directly. After that, the server is no longer needed for the actual file transfer.

## How to run

```bash
cd backend
npm install     # only needed the first time
npm start       # starts the server on port 3001
```

Server will be live at: `http://localhost:3001`

## Events the server handles

| Event | What it does |
|---|---|
| `join-room` | A user joins a room using a room ID |
| `offer` | Forwards the WebRTC offer to the other peer |
| `answer` | Forwards the WebRTC answer back |
| `ice-candidate` | Forwards ICE candidates (connection info) |
| `peer-left` | Notifies when the other person disconnects |

## Notes

- Max 2 people per room (one sender, one receiver)
- Room is automatically deleted when both people leave
- No file data passes through this server — files go directly browser-to-browser
