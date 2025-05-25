import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Base interface for Message properties
interface IMessageBase {
  _id: Types.ObjectId;
  chat: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readBy: Types.ObjectId[];
  createdAt: Date;
}

// Export type for Message Document
export type MessageDocument = Document<Types.ObjectId> & IMessageBase;

// Export interface for Message Model
export interface MessageModel extends Model<MessageDocument> {}

const messageSchema = new Schema<MessageDocument, MessageModel>({
  chat: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'video'],
    default: 'text',
  },
  fileUrl: {
    type: String,
    required: function(this: MessageDocument) {
      return ['image', 'file', 'video'].includes(this.type);
    },
  },
  fileName: {
    type: String,
    required: function(this: MessageDocument) {
      return ['file', 'video'].includes(this.type);
    },
  },
  fileSize: {
    type: Number,
    required: function(this: MessageDocument) {
      return ['file', 'video'].includes(this.type);
    },
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for better query performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ readBy: 1 });

export const Message = mongoose.model<MessageDocument, MessageModel>('Message', messageSchema);
