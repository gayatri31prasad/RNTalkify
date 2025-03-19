const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server,{
    cors: {
      origin: "*",
      // origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room (for demo, using a fixed room name)
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
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

app.get('/', (req, res) => {
  res.send('Hello World!');
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
