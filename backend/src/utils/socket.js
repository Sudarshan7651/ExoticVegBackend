let io;

module.exports = {
  init: (server) => {
    io = require("socket.io")(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      socket.on("join_user_room", (userId) => {
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined room: user_${userId}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
  // Helper to emit events
  emitEvent: (event, data) => {
    if (io) {
      io.emit(event, data);
    }
  },
  // Helper to emit to specific user
  emitToUser: (userId, event, data) => {
    if (io) {
      io.to(`user_${userId}`).emit(event, data);
    }
  },
};
