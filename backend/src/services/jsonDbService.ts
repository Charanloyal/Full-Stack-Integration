import fs from 'fs';
import path from 'path';

const logsFile = './public/uploads/security_logs.json';
const chatsFile = './public/uploads/chat_messages.json';

const ensureFileExists = (filePath: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
};

export const saveLocalLog = async (logData: any): Promise<void> => {
  try {
    ensureFileExists(logsFile);
    const logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
    logs.push({
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      ...logData,
    });
    if (logs.length > 100) logs.shift();
    fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
  } catch (err: any) {
    console.error('[JSON DB Service] Failed to save local log:', err.message);
  }
};

export const getLocalLogs = async (): Promise<any[]> => {
  try {
    ensureFileExists(logsFile);
    const logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
    return logs;
  } catch (err: any) {
    console.error('[JSON DB Service] Failed to read local logs:', err.message);
    return [];
  }
};

export const saveLocalChat = async (chatData: any): Promise<any> => {
  try {
    ensureFileExists(chatsFile);
    const chats = JSON.parse(fs.readFileSync(chatsFile, 'utf8'));
    const newChat = {
      _id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      ...chatData,
    };
    chats.push(newChat);
    if (chats.length > 50) chats.shift();
    fs.writeFileSync(chatsFile, JSON.stringify(chats, null, 2));
    return newChat;
  } catch (err: any) {
    console.error('[JSON DB Service] Failed to save local chat:', err.message);
    return chatData;
  }
};

export const getLocalChats = async (): Promise<any[]> => {
  try {
    ensureFileExists(chatsFile);
    const chats = JSON.parse(fs.readFileSync(chatsFile, 'utf8'));
    return chats;
  } catch (err: any) {
    console.error('[JSON DB Service] Failed to read local chats:', err.message);
    return [];
  }
};
