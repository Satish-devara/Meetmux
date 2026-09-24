const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {};

app.get("/", (req, res) => {
  res.send("Signaling server is running.");
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    const room = rooms[roomId];

    if (room.length >= 2) {
      socket.emit("room-full");
      return;
    }

    room.push(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;

    socket.emit("room-joined", { roomId, total: room.length });

    if (room.length === 2) {
      const firstPerson = room[0];
      io.to(firstPerson).emit("start-offer");
    }
  });

  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", {
      offer: data.offer,
      from: socket.id,
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", {
      answer: data.answer,
      from: socket.id,
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      socket.to(roomId).emit("peer-left");
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});
