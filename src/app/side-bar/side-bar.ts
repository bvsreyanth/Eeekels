import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { ChatSessionDto, UpdateChatTitleRequest } from '../services/api.service';
import { ChatHistoryFacadeService } from '../services/api.chatfacade.service';
import { AiQueryFacade } from '../services/api.aiqueryfacade.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InteractionStatus } from '@azure/msal-browser';
import { filter } from 'rxjs';
import { ChatSelectionService } from '../services/ChatSelectionService';

@Component({
    selector: 'app-side-bar',
    imports: [FormsModule,CommonModule],
    templateUrl: './side-bar.html',
    styleUrl: './side-bar.scss'
})
export class SideBar implements OnInit {
    chats: ChatSessionDto[] = [];
    email = '';
    private router = inject(Router);
    openDropdownId: string | null = null;
    editingChatId: string | null = null;
    editedTitle = '';
    selectedChatId: string | null = null;

  @ViewChild('editInput') editInputRef!: ElementRef;

  userService = inject(ChatHistoryFacadeService);
  msalService = inject(MsalService);
  chatService = inject(AiQueryFacade);
  msalBroadcastService = inject(MsalBroadcastService);
  chatSelection = inject(ChatSelectionService);

  ngOnInit(): void {
      this.msalBroadcastService.inProgress$
          .pipe(filter(status => status === InteractionStatus.None))
          .subscribe(() => {
              let activeAccount = this.msalService.instance.getActiveAccount();
              if (!activeAccount) {
                  const allAccounts = this.msalService.instance.getAllAccounts();
                  if (allAccounts.length > 0) {
                      this.msalService.instance.setActiveAccount(allAccounts[0]);
                      activeAccount = allAccounts[0];
                      console.log('Active account set from cache:', activeAccount);
                  }
              }
              if (activeAccount) {
                  const claims = activeAccount.idTokenClaims;
                  this.email =
            claims?.emails?.[0]?.toLowerCase() ||
            claims?.preferred_username?.toLowerCase() ||
            activeAccount.username?.toLowerCase() ||
            '';
                  console.log('Sidebar email:', this.email);
                  this.loadChats();
              } else {
                  console.warn('No accounts found in MSAL');
              }
          });
      this.chatSelection.selectedChatId$.subscribe(id => {
          this.selectedChatId = id;
      });
      // Listen for reloadSidebarChats event
      window.addEventListener('reloadSidebarChats', () => {
          this.loadChats();
      });
  }

  loadChats(): void {
      this.chatService.getUserByEmail(this.email).subscribe(userRes => {
          const userId = userRes.response;
          if (userId) {
              this.userService.getRecentChats(userId).subscribe(chatRes => {
                  this.chats = chatRes;
              });
          }
      });
  }

  toggleDropdown(chatId?: string) {
      if (!chatId) return;
      this.openDropdownId = this.openDropdownId === chatId ? null : chatId;
  }

  startEditing(chat: ChatSessionDto) {
      if (!chat.chatId || !chat.title) return;
      this.editingChatId = chat.chatId;
      this.editedTitle = chat.title;
      this.openDropdownId = null;
      setTimeout(() => {
          this.editInputRef?.nativeElement?.focus();
      }, 0);
  }

  cancelEdit() {
      this.editingChatId = null;
      this.editedTitle = '';
  }

  saveTitle(chat: ChatSessionDto) {
      const trimmedTitle = this.editedTitle.trim();
      if (!trimmedTitle || trimmedTitle === chat.title) {
          this.cancelEdit();
          return;
      }
      if (!chat.chatId) {
          console.error('Chat ID is missing');
          return;
      }
      const body = new UpdateChatTitleRequest({
          chatId: chat.chatId,
          newTitle: trimmedTitle
      });
      this.userService.updateChatTitle(body).subscribe({
          next: () => {
              chat.title = trimmedTitle;
              this.cancelEdit();
          },
          error: (err) => {
              console.error('Update failed', err);
          }
      });
  }

  deleteChat(chat: ChatSessionDto) {
      if (!confirm('Delete this chat?')) return;
      if (!chat.chatId) {
          console.error('Chat ID is missing, cannot delete.');
          return;
      }
      this.userService.deleteChat(chat.chatId).subscribe({
          next: () => {
              this.chats = this.chats.filter(c => c.chatId !== chat.chatId);
              this.openDropdownId = null;
          },
          error: (err) => {
              console.error('Delete failed', err);
          }
      });
  }

  onChatClick(chatId: string) {
      this.chatSelection.setSelectedChatId(chatId);
      console.log('Selected chat ID:', chatId);
  }

  onPlusClick() {
      const freshChatId = 'new-' + Date.now();
      this.chatSelection.setSelectedChatId(freshChatId);
      this.selectedChatId = freshChatId;
      this.router.navigate(['/assistant'], { queryParams: { chatId: freshChatId } });
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.position-relative')) {
          this.openDropdownId = null;
      }
  }

  handleIconKeydown(event: KeyboardEvent, chatId?: string): void {
      if (!chatId) return;
      const key = event.key.toLowerCase();
      if (key === 'enter' || key === ' ') {
          event.preventDefault();
          this.toggleDropdown(chatId);
      }
  }
}
