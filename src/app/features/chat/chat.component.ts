import { Component, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: string[] = [];
  messageText: string = '';
  private chatSub!: Subscription;

  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  ngOnInit(): void {
    const username = this.authService.currentUserName() || 'Usuario Anónimo';
    
    this.chatService.connect(username);

    if (this.chatSub) {
      this.chatSub.unsubscribe();
    }

    this.chatSub = this.chatService.getMessages().subscribe((msg) => {
      this.ngZone.run(() => {
        this.messages.push(msg);
      });
    });
  }

  send(): void {
    if (this.messageText.trim() !== '') {
      this.chatService.sendMessage(this.messageText);
      this.messageText = '';
    }
  }

  ngOnDestroy(): void {
    if (this.chatSub) {
      this.chatSub.unsubscribe();
    }
  }
}