const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require("cors")
const app = express();
app.use(cors())
app.use(express.json());
const server = http.createServer(app);
const io = socketIO(server,{  cors: {
      origin: "*",
      // origin: "http://localhost:3000",
      // methods: ["GET", "POST"],
      // allowedHeaders: ['Content-Type', 'Authorization'],
    }
  });

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room (for demo, using a fixed room name)
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  // Handle call end
  socket.on('end-call', (data) => {
    console.log(`Call ended by ${socket.id} in room ${data.room}`);
    // socket.to(data.room).emit('call-ended', { from: socket.id });
  });

  // WebRTC signaling for voice call
  socket.on('offer', (data) => {
    // data: { room, offer }
    socket.to(data.room).emit('offer', { offer: data.offer, from: socket.id });
  });

  socket.on('answer', (data) => {
    // data: { room, answer }
    socket.to(data.room).emit('answer', { answer: data.answer, from: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    // data: { room, candidate }
    // console.log('Received ICE candidate:', data);
    socket.to(data.room).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
  });

  // Relay chat messages for 1-to-1 chat
  socket.on('chat-message', (data) => {
    // data: { room, message, sender }
    console.log('Received chat message:', data);
    socket.to(data.room).emit('chat-message', { message: data.message, sender: data.sender });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.json('Hello World!');
})
app.post('/', (req, res) => {
  res.json('Hello World!');
})

