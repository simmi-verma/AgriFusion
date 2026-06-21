module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(' User connected to socket:', socket.id);

    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    socket.on('disconnect', () => {
      console.log(' User disconnected from socket:', socket.id);
    });
  });
};
