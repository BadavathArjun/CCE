const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Store active rooms and their code
const rooms = new Map();
// Track users in rooms
const roomUsers = new Map(); // roomId -> [{id, online}]

function broadcastRoomUsers(roomId) {
    const users = roomUsers.get(roomId) || [];
    io.to(roomId).emit('room-users', users);
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        if (!rooms.has(roomId)) {
            rooms.set(roomId, { code: '', language: 'javascript' });
        }
        socket.emit('code-update', rooms.get(roomId));

        // Add user to roomUsers
        if (!roomUsers.has(roomId)) roomUsers.set(roomId, []);
        let users = roomUsers.get(roomId);
        if (!users.find(u => u.id === socket.id)) {
            users.push({ id: socket.id, online: true });
        } else {
            users = users.map(u => u.id === socket.id ? { ...u, online: true } : u);
            roomUsers.set(roomId, users);
        }
        broadcastRoomUsers(roomId);
    });

    socket.on('code-change', ({ roomId, code, language }) => {
        rooms.set(roomId, { code, language });
        socket.to(roomId).emit('code-update', { code, language });
    });

    socket.on('execute-code', async ({ roomId, code, language, input }) => {
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        let tempFile, command, cleanupFiles = [], runArgs = [], execType = 'exec';

        if (language === 'javascript') {
            tempFile = path.join(tempDir, `temp_${roomId}.js`);
            fs.writeFileSync(tempFile, code);
            command = 'node';
            runArgs = [tempFile];
            cleanupFiles.push(tempFile);
            execType = 'spawn';
        } else if (language === 'python') {
            tempFile = path.join(tempDir, `temp_${roomId}.py`);
            fs.writeFileSync(tempFile, code);
            command = 'python';
            runArgs = [tempFile];
            cleanupFiles.push(tempFile);
            execType = 'spawn';
        } else if (language === 'c') {
            tempFile = path.join(tempDir, `temp_${roomId}.c`);
            const outputExe = path.join(tempDir, `temp_${roomId}_c.exe`);
            fs.writeFileSync(tempFile, code);
            exec(`gcc ${tempFile} -o ${outputExe}`, (compileErr, stdout, stderr) => {
                if (compileErr || stderr) {
                    io.to(roomId).emit('execution-result', { output: stdout, error: stderr || compileErr.message });
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    if (fs.existsSync(outputExe)) fs.unlinkSync(outputExe);
                    return;
                }
                const child = spawn(outputExe, [], { stdio: ['pipe', 'pipe', 'pipe'] });
                let out = '', err = '';
                if (input) child.stdin.write(input + '\n');
                child.stdin.end();
                child.stdout.on('data', data => out += data);
                child.stderr.on('data', data => err += data);
                child.on('close', () => {
                    io.to(roomId).emit('execution-result', { output: out, error: err });
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    if (fs.existsSync(outputExe)) fs.unlinkSync(outputExe);
                });
            });
            return;
        } else if (language === 'cpp') {
            tempFile = path.join(tempDir, `temp_${roomId}.cpp`);
            const outputExe = path.join(tempDir, `temp_${roomId}_cpp.exe`);
            fs.writeFileSync(tempFile, code);
            exec(`g++ ${tempFile} -o ${outputExe}`, (compileErr, stdout, stderr) => {
                if (compileErr || stderr) {
                    io.to(roomId).emit('execution-result', { output: stdout, error: stderr || compileErr.message });
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    if (fs.existsSync(outputExe)) fs.unlinkSync(outputExe);
                    return;
                }
                const child = spawn(outputExe, [], { stdio: ['pipe', 'pipe', 'pipe'] });
                let out = '', err = '';
                if (input) child.stdin.write(input + '\n');
                child.stdin.end();
                child.stdout.on('data', data => out += data);
                child.stderr.on('data', data => err += data);
                child.on('close', () => {
                    io.to(roomId).emit('execution-result', { output: out, error: err });
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    if (fs.existsSync(outputExe)) fs.unlinkSync(outputExe);
                });
            });
            return;
        } else if (language === 'java') {
            tempFile = path.join(tempDir, `Main.java`);
            fs.writeFileSync(tempFile, code);
            exec(`cd ${tempDir} && javac Main.java`, (compileErr, stdout, stderr) => {
                if (compileErr || stderr) {
                    io.to(roomId).emit('execution-result', { output: stdout, error: stderr || compileErr.message });
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    if (fs.existsSync(path.join(tempDir, 'Main.class'))) fs.unlinkSync(path.join(tempDir, 'Main.class'));
                    return;
                }
                const child = spawn('java', ['-cp', tempDir, 'Main'], { stdio: ['pipe', 'pipe', 'pipe'] });
                let out = '', err = '';
                if (input) child.stdin.write(input + '\n');
                child.stdin.end();
                child.stdout.on('data', data => out += data);
                child.stderr.on('data', data => err += data);
                child.on('close', () => {
                    io.to(roomId).emit('execution-result', { output: out, error: err });
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    if (fs.existsSync(path.join(tempDir, 'Main.class'))) fs.unlinkSync(path.join(tempDir, 'Main.class'));
                });
            });
            return;
        } else {
            io.to(roomId).emit('execution-result', { output: '', error: 'Unsupported language.' });
            return;
        }

        if (execType === 'spawn') {
            const child = spawn(command, runArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
            let out = '', err = '';
            if (input) child.stdin.write(input + '\n');
            child.stdin.end();
            child.stdout.on('data', data => out += data);
            child.stderr.on('data', data => err += data);
            child.on('close', () => {
                io.to(roomId).emit('execution-result', { output: out, error: err });
                cleanupFiles.forEach(file => {
                    if (fs.existsSync(file)) fs.unlinkSync(file);
                });
            });
        } else {
            exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
                const result = {
                    output: stdout,
                    error: stderr || (error ? error.message : '')
                };
                io.to(roomId).emit('execution-result', result);
                cleanupFiles.forEach(file => {
                    if (fs.existsSync(file)) fs.unlinkSync(file);
                });
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Mark user as offline in all rooms
        for (const [roomId, users] of roomUsers.entries()) {
            let changed = false;
            roomUsers.set(roomId, users.map(u => {
                if (u.id === socket.id && u.online) {
                    changed = true;
                    return { ...u, online: false };
                }
                return u;
            }));
            if (changed) broadcastRoomUsers(roomId);
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 