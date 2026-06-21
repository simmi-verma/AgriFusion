const router = require('express').Router();
const mongoose = require('mongoose');
const Chat = require('../models/chat');
const Message = require('../models/Message');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

// Get list of conversations
router.get('/conversations', verifyToken(['customer', 'farmer']), async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id }).populate('participants', 'name email role');
    const conversations = chats.map(chat => {
      const other = chat.participants.find(p => p._id.toString() !== req.user.id);
      return { chatId: chat._id, otherUser: other };
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get/create chat with specific user (otherParticipantId)
router.get('/:otherParticipantId', verifyToken(['customer', 'farmer']), async (req, res) => {
  try {
    const { otherParticipantId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(otherParticipantId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user or receiver ID.' });
    }

    let chat = await Chat.findOne({ participants: { $all: [userId, otherParticipantId] } });
    if (!chat) {
      chat = new Chat({ participants: [userId, otherParticipantId] });
      await chat.save();
    }

    const messages = await Message.find({ chatId: chat._id }).populate('sender', 'name role');
    const otherUser = await User.findById(otherParticipantId).select('name role location');
    
    res.json({
      messages,
      chatId: chat._id,
      userId,
      receiverId: otherParticipantId, // kept for backwards compatibility in frontend API response parsing
      receiverName: otherUser ? otherUser.name : 'User'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message
router.post('/send', verifyToken(['customer', 'farmer']), async (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!content || !chatId) {
      return res.status(400).json({ error: 'Chat ID and content are required' });
    }

    const newMessage = new Message({
      chatId,
      sender: req.user.id,
      content
    });
    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name role');
    
    // Broadcast the message to the Socket.io room via req.io context
    if (req.io) {
      req.io.to(chatId).emit('message', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete conversation
router.delete('/:chatId', verifyToken(['customer', 'farmer']), async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID.' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat conversation not found.' });
    }

    // Check if user is a participant in the conversation
    const isParticipant = chat.participants.some(p => p.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied. You are not a participant in this conversation.' });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chatId });

    // Delete the chat itself
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: 'Conversation deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
