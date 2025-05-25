import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Base interface for Chat properties
interface IChatBase {
  _id: Types.ObjectId;
  type: 'private' | 'group';
  participants: Types.ObjectId[];
  name?: string;
  avatar?: string;
  lastMessage?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Export type for Chat Document
export type ChatDocument = Document<Types.ObjectId> & IChatBase;

// Export interface for Chat Model
export interface ChatModel extends Model<ChatDocument> {}

const chatSchema = new Schema<ChatDocument, ChatModel>({
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true,
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  name: {
    type: String,
    required: function(this: ChatDocument) {
      return this.type === 'group';
    },
  },
  avatar: {
    type: String,
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for better query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

export const Chat = mongoose.model<ChatDocument, ChatModel>('Chat', chatSchema);
