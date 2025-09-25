import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { catchError, EMPTY, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AiQueryFacade } from '../services/api.aiqueryfacade.service';
import { ApiResponse, ChatSessionDto, MessageDto, UserQueryRequest } from '../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { Chat } from '../Interfaces/Chat';
import { Message } from '../Interfaces/Message';
import { marked } from 'marked';
import { ChatSelectionService } from '../services/ChatSelectionService';

@Component({
    selector: 'app-chat-bot',
    imports: [FormsModule, ReactiveFormsModule, CommonModule],
    templateUrl: './chat-bot.html',
    styleUrl: './chat-bot.scss'
})
export class ChatBot implements OnInit, AfterViewInit, OnDestroy {
    protected prompt = '';
    protected stopperImageLoad = false;
    protected response = '';
    protected height = 'auto';
    protected promptDisabled = false;
    protected previousChats: Message[] = [];
    protected userIdentifier!: string;
    protected selectedChatId: string | null = null;
    protected identifier = '';
    protected username = '';
    protected name = '';
    protected chats: Chat[] = [];
    protected filteredChats: Chat[] = [];
    protected promptCount = 0;
    protected isLoading = false;


  @ViewChild('chatWin') private readonly scrollableDiv!: ElementRef;

  private readonly unsubscribe$ = new Subject<boolean>();
  readonly #apiservice = inject(AiQueryFacade);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly chatSelection=inject(ChatSelectionService);



  ngOnInit(): void {
      this.isLoading = true;
      this.initializename();
      this.initializeUserAndChats();
      this.chatSelection.selectedChatId$
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe(chatId => {
              if (chatId) {
                  if (!chatId.startsWith('new-')) {
                      this.onTitleClick(chatId);
                  } else {
                      this.previousChats = [];
                      this.isLoading = false;
                      this.selectedChatId = chatId;
                      this.identifier = chatId;
                      setTimeout(() => this.scrollToBottom(), 0);
                  }
              }
          });
      this.activatedRoute.queryParams
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe(params => {
              const chatId = params['chatId'];
              if (chatId && chatId.startsWith('new-')) {
                  this.previousChats = [];
                  this.isLoading = false;
                  this.selectedChatId = chatId;
                  this.identifier = chatId;
                  setTimeout(() => this.scrollToBottom(), 0);
              } else if (chatId) {
                  this.selectedChatId = chatId;
                  this.identifier = chatId;
                  this.#apiservice.getChatMessages(chatId)
                      .pipe(takeUntil(this.unsubscribe$))
                      .subscribe({
                          next: (messages: MessageDto[]) => {
                              this.previousChats = messages.map(msg => ({
                                  prompt: msg.prompt ?? '',
                                  response: this.convertMarkdownToHtml(msg.response ?? ''),
                                  conversationMessagesID: msg.messageId ? Number(msg.messageId) : 0,
                                  timestamp: this.adjustTimestamp(msg.timestamp),
                                  formattedResponse: '',
                                  isLoading: false,
                                  isError: false
                              }));
                              this.isLoading = false;
                              setTimeout(() => this.scrollToBottom(), 0);
                          },
                          error: () => {
                              this.isLoading = false;
                          }
                      });
              } else {
                  this.isLoading = false;
                  setTimeout(() => {
                      const firstValidChat = this.chats[0];
                      if (firstValidChat) {
                          this.onTitleClick(firstValidChat.chatId);
                      }
                  }, 1000);
              }
          });
  }

  protected onSubmit(): void {
      if (!this.userIdentifier) return;
      this.promptDisabled = true;
      this.isLoading = true;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const userPrompt = this.prompt;
      this.previousChats.push({
          prompt: userPrompt,
          response: '',
          conversationMessagesID: 0,
          timestamp: new Date().toISOString(),
          formattedResponse: '',
          isLoading: false,
          isError: false
      });
      const loaderMessage: Message = {
          prompt: '',
          response: '',
          conversationMessagesID: 0,
          timestamp: new Date().toISOString(),
          formattedResponse: '',
          isLoading: true,
          isError: false
      };
      this.previousChats.push(loaderMessage);
      const loaderIndex = this.previousChats.length - 1;
      setTimeout(() => this.scrollToBottom(true), 0);
      const newChatMessage = {
          userId: this.userIdentifier,
          chatId: String((String(this.identifier).startsWith('new-')) ? '00000000-0000-0000-0000-000000000000' : (this.identifier || this.selectedChatId || '0')),
          prompt: userPrompt,
          userTimeZone: timeZone
      } as unknown as UserQueryRequest;
      this.prompt = '';
      this.#apiservice.postQuery(newChatMessage)
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe({
              next: (response:ApiResponse) => {
                  let actualResponseContent = '';
                  if (typeof response.response === 'string') {
                      actualResponseContent = response.response;
                      console.log(actualResponseContent);
                  } else if (response.response && typeof response.response === 'object' && 'response' in response.response) {
                      actualResponseContent = (response.response as { response: string }).response;
                  }
                  this.previousChats[loaderIndex] = {
                      prompt: '',
                      response: this.convertMarkdownToHtml(actualResponseContent),
                      conversationMessagesID: Number(response.chatId),
                      timestamp: new Date().toISOString(),
                      formattedResponse: '',
                      isLoading: false,
                      isError: false
                  };
                  if (
                      !this.identifier || this.identifier === '00000000-0000-0000-0000-000000000000' ||String(this.identifier).startsWith('new-')
                  ) {
                      this.identifier = response.chatId!;
                      this.selectedChatId = response.chatId!;

                      import('../services/api.chatfacade.service').then(({ ChatHistoryFacadeService }) => {
                          const chatHistoryService = inject(ChatHistoryFacadeService);
                          chatHistoryService.getRecentChats(this.userIdentifier).subscribe((chats) => {
                              const newChat = chats.find(c => c.chatId === response.chatId);
                              if (newChat) {
                                  window.dispatchEvent(new CustomEvent('reloadSidebarChats'));
                              }
                          });
                      });
                  }
                  this.promptDisabled = false;
                  this.isLoading = false;
                  setTimeout(() => this.scrollToBottom(false), 0);
              },
              error: () => {
                  this.previousChats[loaderIndex] = {
                      prompt: '',
                      response: 'Error: failed to load response.',
                      conversationMessagesID: 0,
                      timestamp: new Date().toISOString(),
                      formattedResponse: '',
                      isLoading: false,
                      isError: true
                  };
                  this.promptDisabled = false;
                  this.isLoading = false;
              }
          });
  }

  protected onTitleClick(chatId: string): void {
      this.selectedChatId = chatId;
      this.#apiservice.getChatMessages(chatId)
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe({
              next: (messages: MessageDto[]) => {
                  this.previousChats = messages.map((message) => {
                      let rawResponse = '';
                      if (typeof message.response === 'string') {
                          rawResponse = message.response;
                      } else if (
                          typeof message.response === 'object' &&
              message.response !== null &&
              'response' in message.response &&
              typeof (message.response as { response: unknown }).response === 'string'
                      ) {
                          rawResponse = (message.response as { response: string }).response;
                      }
                      return {
                          prompt: message.prompt ?? '',
                          response: this.convertMarkdownToHtml(rawResponse),
                          conversationMessagesID: Number(message.messageId) || 0,
                          timestamp: this.adjustTimestamp(message.timestamp),
                          formattedResponse: '',
                          isLoading: false,
                          isError: false
                      };
                  });
                  this.isLoading = false;
                  setTimeout(() => this.scrollToBottom(), 0);
              },
              error: () => {
                  this.isLoading = false;
              }
          });
  }

  private initializeUserAndChats(): void {
      Object.values(sessionStorage).forEach((x) => {
          if (x.includes('username')) {
              const token = JSON.parse(x);
              this.username = token.username;
          }
      });
      this.#apiservice.getUserByEmail(this.username)
          .pipe(
              catchError(() => of({ response: '' })),
              switchMap((user) =>
                  user.response
                      ? of(user)
                      : this.#apiservice.createUser(this.username).pipe(
                          catchError(() => of({ response: '' }))
                      )
              ),
              switchMap((user) => {
                  if (!user.response) return EMPTY;
                  this.userIdentifier = user.response;
                  return this.#apiservice.getRecentChats(this.userIdentifier).pipe(
                      catchError(() => of([]))
                  );
              }),
              takeUntil(this.unsubscribe$)
          )
          .subscribe((chatDtos: ChatSessionDto[]) => {
              this.chats = chatDtos
                  .filter(chat => (chat.title ?? '').trim() !== '')
                  .map(chat => ({
                      chatId: chat.chatId ?? '',
                      title: chat.title ?? '',
                      timestamp: chat.timestamp ? new Date(chat.timestamp).toISOString() : '',
                      messages: (chat.messages ?? []).map(msg => ({
                          prompt: msg.prompt ?? '',
                          response: msg.response ?? '',
                          conversationMessagesID: Number(msg.messageId) || 0,
                          timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : '',
                          formattedResponse: '',
                          isLoading: false,
                          isError: false
                      }))
                  }));
              this.filteredChats = [...this.chats];
              this.updatePromptCount();
              if (!this.identifier && this.chats.length > 0) {
                  this.onTitleClick(this.chats[0].chatId);
              }
          });
  }

  private updatePromptCount(): void {
      this.promptCount = this.filteredChats.length;
  }

  protected onInputChange(event: Event): void {
      const textArea = event.target as HTMLTextAreaElement;
      textArea.style.height = 'auto';
      textArea.style.height = `${textArea.scrollHeight}px`;
  }

  removeQuotes(title: string): string {
      return title?.replace(/^["']|["']$/g, '') || '';
  }

  private adjustTimestamp(timestamp: Date | undefined): string {
      const date = timestamp ? new Date(timestamp) : new Date();
      date.setHours(date.getHours() + 2);
      return date.toISOString();
  }

  ngAfterViewInit(): void {
      this.scrollToBottom(true);
  }

  ngOnDestroy(): void {
      this.unsubscribe$.next(true);
      this.unsubscribe$.complete();
  }

  private scrollToBottom(instant = false): void {
      if (this.scrollableDiv?.nativeElement) {
          const el = this.scrollableDiv.nativeElement;
          if (instant) {
              el.scrollTop = el.scrollHeight;
          } else {
              el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
          }
      }
  }

  private initializename(): void {
      Object.values(sessionStorage).forEach((x) => {
          if (x.includes('name')) {
              const token = JSON.parse(x);
              this.name = token.name;

          }
      }
      );
  }

  private convertMarkdownToHtml(markdown: unknown): string {
      if (typeof markdown !== 'string') {
          console.warn('Invalid markdown input:', markdown);
          return '';
      }
      marked.setOptions({ breaks: true, gfm: true });
      const result = marked(markdown);
      return typeof result === 'string' ? result : '';
  }

  protected sendQuickPrompt(promptText: string): void {
      const tempPrompt = this.prompt;
      this.prompt = promptText;
      this.onSubmit();
      setTimeout(() => this.scrollToBottom(true), 0);
      this.prompt = tempPrompt;
  }
}
