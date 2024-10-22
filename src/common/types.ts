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
}
