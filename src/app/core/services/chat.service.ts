import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<string>();

  constructor() {}

  public connect(username: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket('ws://localhost:8887');

    this.socket.onopen = () => {
      this.socket?.send(username);
    };

    this.socket.onmessage = (event) => {
      this.messageSubject.next(event.data);
    };

    this.socket.onclose = () => {
      console.log('Desconectado del servidor');
      this.socket = null;
    };

    this.socket.onerror = (error) => {
      console.error('Error en el WebSocket:', error);
    };
  }

  public sendMessage(message: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.warn('El socket no está abierto.');
    }
  }

  public getMessages(): Observable<string> {
    return this.messageSubject.asObservable();
  }
}