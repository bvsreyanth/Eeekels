export interface Message {
  conversationMessagesID: number;
  prompt: string;
  response: string;
  timestamp: string;
  formattedResponse: string;
  isLoading: boolean;
   isError: boolean
}
