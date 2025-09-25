import { inject, Injectable } from '@angular/core';
import { ApiResponse, ChatHistoryClient, ChatSessionDto, CreateUserResponse, EmailRequest, GetRecentChatsResponse, GetUserIdResponse, IGetChatMessagesResponse, MessageDto, QueryClient, UserClient, UserQueryRequest } from './api.service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class AiQueryFacade {
    private readonly aiClient = inject(QueryClient);
    private readonly chatHistoryClient = inject(ChatHistoryClient);
    private readonly userClient = inject(UserClient);

    postQuery(data: UserQueryRequest | undefined): Observable<ApiResponse> {
        return this.aiClient.aI(data);
    }

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

    getUserByEmail(email: string): Observable<{ response: string }> {
        return this.userClient.getUserId(email).pipe(
            map((res: GetUserIdResponse) => ({
                response: res.userId ?? ''
            })),
            catchError(() => of({ response: '' }))
        );
    }

    createUser(email: string): Observable<{ response: string }> {
        const request = new EmailRequest({ email });
        return this.userClient.createUser(request).pipe(
            map((res: CreateUserResponse) => ({
                response: res.userId ?? ''
            })),
            catchError(() => of({ response: '' }))
        );
    }
}
