const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: "*" } })

let rooms = {}

app.get("/", (req, res) => {
  res.send("server is up")
})

io.on("connection", (socket) => {
  console.log("someone connected:", socket.id)

  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = []

    if (rooms[roomId].length >= 2) {
      socket.emit("room-full")
      return
    }

    rooms[roomId].push(socket.id)
    socket.join(roomId)
    socket.roomId = roomId

    socket.emit("room-joined", { roomId, total: rooms[roomId].length })

    if (rooms[roomId].length === 2) {
      io.to(rooms[roomId][0]).emit("start-offer")
    }
  })

  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", { offer: data.offer, from: socket.id })
  })

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", { answer: data.answer, from: socket.id })
  })

  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", { candidate: data.candidate })
  })

  socket.on("disconnect", () => {
    let roomId = socket.roomId
    if (!roomId || !rooms[roomId]) return

    rooms[roomId] = rooms[roomId].filter(id => id !== socket.id)
    socket.to(roomId).emit("peer-left")

    if (rooms[roomId].length === 0) delete rooms[roomId]

    console.log(socket.id, "left room", roomId)
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log("running on port", PORT))
