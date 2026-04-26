import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
    if (socket?.connected) return socket;
    socket = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
    });
    socket.on('connect', () => console.log('Socket connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinBusRoom = (busId) => {
    if (socket) socket.emit('join-bus', busId);
};
