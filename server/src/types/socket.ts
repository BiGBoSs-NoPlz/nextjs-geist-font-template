import { Server as SocketIOServer, Socket } from 'socket.io';
import { UserDocument } from '../models/User';

export interface ServerToClientEvents {
  'message:receive': (data: { chatId: string; message: any }) => void;
  'typing:update': (data: { chatId: string; userId: string; isTyping: boolean }) => void;
  'user:status': (data: { userId: string; status: 'online' | 'offline' }) => void;
}

export interface ClientToServerEvents {
  'message:send': (data: { chatId: string; message: any }) => void;
  'typing:start': (chatId: string) => void;
  'typing:stop': (chatId: string) => void;
}

export interface SocketData {
  user: UserDocument;
}

export type CustomSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;

export type CustomServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;
