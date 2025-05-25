# Real-time Chat Application Server

A robust real-time chat server built with Node.js, Express, Socket.IO, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (for database)

## MongoDB Atlas Setup

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Click "Connect" and choose "Connect your application"
4. Copy the connection string
5. Replace the placeholder values in your .env file:
   - Replace `chat-app` with your username
   - Replace `chat-app-password` with your password
   - Replace `cluster0.mongodb.net` with your cluster URL

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create uploads directory:
   ```bash
   mkdir uploads
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values as needed

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication

#### Register a new user
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Chats

#### Get all chats
```http
GET /api/chats
Authorization: Bearer <token>
```

#### Create private chat
```http
POST /api/chats/private
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientId": "<user_id>"
}
```

#### Create group chat
```http
POST /api/chats/group
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Group Name",
  "participants": ["user_id1", "user_id2"]
}
```

### Messages

#### Get messages
```http
GET /api/messages/:chatId?page=1&limit=50
Authorization: Bearer <token>
```

#### Send message
```http
POST /api/messages/:chatId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello!"
}
```

#### Send file
```http
POST /api/messages/:chatId
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
```

#### Delete message
```http
DELETE /api/messages/:messageId
Authorization: Bearer <token>
```

## WebSocket Events

### Client to Server

- `message:send`: Send a new message
  ```typescript
  {
    chatId: string;
    content?: string;
    file?: File;
  }
  ```

- `typing:start`: Indicate user started typing
  ```typescript
  {
    chatId: string;
  }
  ```

- `typing:stop`: Indicate user stopped typing
  ```typescript
  {
    chatId: string;
  }
  ```

### Server to Client

- `message:receive`: New message received
  ```typescript
  {
    chatId: string;
    message: Message;
  }
  ```

- `typing:update`: Typing status update
  ```typescript
  {
    chatId: string;
    userId: string;
    isTyping: boolean;
  }
  ```

- `user:status`: User online/offline status update
  ```typescript
  {
    userId: string;
    status: 'online' | 'offline';
  }
  ```

## File Upload

- Supported file types: Images (JPEG, PNG, GIF), Videos (MP4), Documents (PDF, DOC, DOCX)
- Maximum file size: 10MB
- Files are stored in the `uploads` directory
- File URLs are relative to the server base URL

## Error Handling

All API endpoints return consistent error responses:

```typescript
{
  error: string;
}
```

HTTP Status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Run in production mode
npm start
```

## Security Features

- JWT authentication
- Password hashing with bcrypt
- CORS protection
- File upload validation
- Rate limiting
- Input validation with Zod
- WebSocket authentication

## License

MIT
