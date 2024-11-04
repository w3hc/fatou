import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ConversationHistory, Conversation, Message } from '../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private dbPath: string;
  private data: ConversationHistory;

  constructor() {
    // Store in data directory instead of project root
    this.dbPath = join(process.cwd(), 'data', 'db.json');
    this.data = { conversations: {} };
  }

  async onModuleInit() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = join(process.cwd(), 'data');
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }

      // Ensure the file exists and is readable
      try {
        await fs.access(this.dbPath);
        const content = await fs.readFile(this.dbPath, 'utf-8');
        this.data = JSON.parse(content);
      } catch (error) {
        // If file doesn't exist or is invalid, create with default data
        await this.saveData();
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async saveData(): Promise<void> {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save database:', error);
      throw error;
    }
  }

  async createConversation(
    fileName?: string,
    fileContent?: string,
  ): Promise<string> {
    const id = uuidv4();
    const conversation: Conversation = {
      id,
      messages: [],
      fileName,
      fileContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.conversations[id] = conversation;
    await this.saveData();
    return id;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.data.conversations[id] || null;
  }

  async addMessage(
    conversationId: string,
    message: Pick<Message, 'role' | 'content'>,
  ): Promise<void> {
    const conversation = this.data.conversations[conversationId];
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const newMessage: Message = {
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
    };

    conversation.messages.push(newMessage);
    conversation.updatedAt = new Date().toISOString();
    await this.saveData();
  }

  async listConversations(): Promise<Conversation[]> {
    return Object.values(this.data.conversations).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async deleteConversation(id: string): Promise<void> {
    delete this.data.conversations[id];
    await this.saveData();
  }
}
