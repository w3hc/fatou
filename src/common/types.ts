export interface ClaudeApiResponse {
  content: Array<{ text: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface CostMetrics {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
}

export interface ClaudeResponse {
  answer: string;
  costs: CostMetrics;
  conversationId?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  fileName?: string;
  fileContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationHistory {
  conversations: { [id: string]: Conversation };
}
