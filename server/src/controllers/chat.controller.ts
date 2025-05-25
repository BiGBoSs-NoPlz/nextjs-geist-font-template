import { Response } from 'express';
import { z } from 'zod';
import { Chat } from '../models/Chat';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Validation schemas
const createPrivateChatSchema = z.object({
  recipientId: z.string(),
});

const createGroupChatSchema = z.object({
  name: z.string().min(2),
  participants: z.array(z.string()).min(2),
});

export const getChats = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const chats = await Chat.find({
      participants: { $in: [req.user._id] },
    })
      .populate('participants', 'name email avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    return res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const createPrivateChat = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const validation = createPrivateChatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const { recipientId } = validation.data;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      type: 'private',
      participants: {
        $all: [req.user._id, recipientId],
        $size: 2,
      },
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new chat
    const chat = await Chat.create({
      type: 'private',
      participants: [req.user._id, recipientId],
      createdBy: req.user._id,
    });

    await chat.populate('participants', 'name email avatar');

    return res.status(201).json(chat);
  } catch (error) {
    console.error('Create private chat error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const createGroupChat = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const validation = createGroupChatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const { name, participants } = validation.data;

    // Add current user to participants if not included
    if (!participants.includes(req.user._id.toString())) {
      participants.push(req.user._id.toString());
    }

    // Check if all participants exist
    const users = await User.find({ _id: { $in: participants } });
    if (users.length !== participants.length) {
      return res.status(404).json({ error: 'One or more participants not found' });
    }

    // Create new chat
    const chat = await Chat.create({
      name,
      type: 'group',
      participants,
      createdBy: req.user._id,
    });

    await chat.populate('participants', 'name email avatar');

    return res.status(201).json(chat);
  } catch (error) {
    console.error('Create group chat error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getChatById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: { $in: [req.user._id] },
    })
      .populate('participants', 'name email avatar')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    return res.json(chat);
  } catch (error) {
    console.error('Get chat by id error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
