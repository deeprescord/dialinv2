import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DialSuggestion {
  name: string;
  minLabel: string;
  maxLabel: string;
  defaultValue: number;
}

export interface ItemDescription {
  description: string;
  dials: DialSuggestion[];
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

  async describeItemWithDials(itemTitle: string, itemType?: string): Promise<ItemDescription> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [
            {
              role: 'system',
              content: 'You are a creative assistant that describes items and suggests relevant dials users can adjust. Suggest 2-4 contextual dials based on the item type.'
            },
            {
              role: 'user',
              content: `Describe this ${itemType || 'item'}: "${itemTitle}". Suggest relevant dials that users might want to adjust (e.g., for food: spiciness, sweetness; for music: energy, tempo; for locations: atmosphere, activity level).`
            }
          ],
          useStructuredOutput: true
        }
      });

      if (error) {
        throw error;
      }

      // Extract structured output from tool call
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        return parsed as ItemDescription;
      }

      throw new Error('No structured output received');
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate description and dials');
    }
  }
}

export const aiService = new AIService();