import { Message } from './Message';

export interface Chat {
  chatId: string;
  title: string;
  timestamp: string;
  messages: Message[];
}
