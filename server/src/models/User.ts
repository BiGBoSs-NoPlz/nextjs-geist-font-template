import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Base interface for User properties
interface IUserBase {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
  friends: Types.ObjectId[];
  createdAt: Date;
}

// Interface for User methods
interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Export type for User Document with methods
export type UserDocument = Document<Types.ObjectId> & IUserBase & IUserMethods;

// Export interface for User Model
export interface UserModel extends Model<UserDocument> {}

const userSchema = new Schema<UserDocument, UserModel>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: {
    type: String,
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline',
  },
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

export const User = mongoose.model<UserDocument, UserModel>('User', userSchema);
