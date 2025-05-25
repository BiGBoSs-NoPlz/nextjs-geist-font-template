import { Response } from 'express';
import { z } from 'zod';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config';
import fileUpload from 'express-fileupload';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Validation schemas
const sendMessageSchema = z.object({
  content: z.string().optional(),
  // File is optional and handled separately through express-fileupload
});

const getMessagesSchema = z.object({
  chatId: z.string(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(50),
});

const deleteMessageSchema = z.object({
  messageId: z.string(),
});

const MESSAGES_PER_PAGE = 50;

export const getMessages = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const validation = getMessagesSchema.safeParse({
      chatId: req.params.chatId,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : MESSAGES_PER_PAGE,
    });

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const { chatId, page, limit } = validation.data;

    // Check if user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: { $in: [req.user._id] },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Now page and limit are guaranteed to be numbers due to zod validation
    const skipAmount = (page - 1) * limit;

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skipAmount)
      .limit(limit)
      .populate('sender', 'name email avatar');

    return res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const validation = sendMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const chatId = req.params.chatId;
    const { content } = validation.data;

    // Check if user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: { $in: [req.user._id] },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    let fileUrl: string | undefined;

    // Handle file upload if present
    if (req.files && req.files.file) {
      const file = req.files.file as fileUpload.UploadedFile;
      const ext = path.extname(file.name);
      const fileName = `${uuidv4()}${ext}`;
      const uploadPath = path.join(__dirname, '..', '..', config.uploadDir, fileName);

      await file.mv(uploadPath);
      fileUrl = `/uploads/${fileName}`;
    }

    if (!content && !fileUrl) {
      return res.status(400).json({ error: 'Message must contain either text or a file' });
    }

    const message = await Message.create({
      content,
      file: fileUrl,
      chat: chatId,
      sender: req.user._id,
    });

    await message.populate('sender', 'name email avatar');

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      $inc: { messageCount: 1 },
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const validation = deleteMessageSchema.safeParse({
      messageId: req.params.messageId,
    });

    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const { messageId } = validation.data;

    // Find message and check ownership
    const message = await Message.findOne({
      _id: messageId,
      sender: req.user._id,
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Delete message
    await message.deleteOne();

    // Update chat's message count
    await Chat.findByIdAndUpdate(message.chat, {
      $inc: { messageCount: -1 },
    });

    return res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
