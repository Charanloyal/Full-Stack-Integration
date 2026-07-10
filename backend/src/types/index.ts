export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string; // 'TODO' | 'IN_PROGRESS' | 'DONE'
  dueDate: Date | null;
  attachmentUrl: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: Partial<User>;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string;
  createdAt?: Date;
}

export interface SecurityLog {
  id?: string;
  eventType: string;
  ip: string;
  details: string;
  userId?: string | null;
  createdAt?: Date;
}
