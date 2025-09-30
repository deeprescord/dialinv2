import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  async sendMessage(messages: ChatMessage[]): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages }
      });

      if (error) {
        throw error;
      }

      return data.content || 'Sorry, I couldn\'t generate a response.';
    } catch (error) {
      console.error('AI Service Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get AI response');
    }
  }
}

export const aiService = new AIService();