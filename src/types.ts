export interface PromptEvaluation {
  overallScore: number;
  clarityScore: number;
  specificityScore: number;
  relevanceScore: number;
  feedback: string;
  optimizedPrompt: string;
  promptType: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  prompt: string;
  evaluation: PromptEvaluation;
}
