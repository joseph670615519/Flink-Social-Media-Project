const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // When user disconnects, notify others
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        socket.broadcast.emit('user-disconnected'); // Notify remaining users
    });

    // Forward various signals
    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });

    socket.on('candidate', (candidate) => {
        socket.broadcast.emit('candidate', candidate);
    });

    // Added: when call is declined
    socket.on('decline', () => {
        socket.broadcast.emit('decline');
    });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));