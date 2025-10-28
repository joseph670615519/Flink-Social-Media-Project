const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // เมื่อผู้ใช้ตัดการเชื่อมต่อ ให้แจ้งคนอื่น
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        socket.broadcast.emit('user-disconnected'); // แจ้งเตือนผู้ใช้ที่ยังอยู่
    });

    // ส่งต่อสัญญาณต่างๆ
    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });

    socket.on('candidate', (candidate) => {
        socket.broadcast.emit('candidate', candidate);
    });

    // เพิ่ม: เมื่อมีการปฏิเสธสาย
    socket.on('decline', () => {
        socket.broadcast.emit('decline');
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));