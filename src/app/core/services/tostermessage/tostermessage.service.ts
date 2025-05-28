import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToasterMessageService {
  private messageSource = new BehaviorSubject<string>('');
  currentMessage$ = this.messageSource.asObservable();

  sendMessage(message: string) {
    this.messageSource.next(message);
  }

  clearMessage() {
    this.messageSource.next('');
  }
}
