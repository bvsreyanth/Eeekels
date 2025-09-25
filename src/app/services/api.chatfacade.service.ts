import { inject, Injectable } from '@angular/core';
import { ChatHistoryClient, ChatSessionDto, GetRecentChatsResponse, IGetChatMessagesResponse, MessageDto, UpdateChatTitleRequest } from './api.service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatHistoryFacadeService{
    private readonly chatHistoryClient = inject(ChatHistoryClient);

    getRecentChats(userId: string): Observable<ChatSessionDto[]> {
        return this.chatHistoryClient.getRecentChats(userId).pipe(
            map((res: GetRecentChatsResponse) => res.chatSessions ?? []),
            catchError(() => of([]))
        );
    }

    getChatMessages(chatId: string): Observable<MessageDto[]> {
        return this.chatHistoryClient.getChatMessages(chatId).pipe(
            map((res: IGetChatMessagesResponse) => res.messages ?? [])
        );
    }

    updateChatTitle(body:UpdateChatTitleRequest):Observable<void>{
        return this.chatHistoryClient.updateChatTitle(body);
    }

    deleteChat(chatId:string):Observable<void>{
        return this.chatHistoryClient.deleteChat(chatId);
    }
}
