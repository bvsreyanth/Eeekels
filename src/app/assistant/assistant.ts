import { Component } from '@angular/core';
import { SideBar } from '../side-bar/side-bar';
import { ChatBot } from '../chat-bot/chat-bot';

@Component({
    selector: 'app-assistant',
    imports: [SideBar, ChatBot],
    templateUrl: './assistant.html',
    styleUrl: './assistant.scss'
})
export class Assistant {

}
