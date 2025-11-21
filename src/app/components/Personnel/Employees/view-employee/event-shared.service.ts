import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventSharedService {

  private contractsUpdatedSource = new BehaviorSubject<boolean>(false);
  contractsUpdated$ = this.contractsUpdatedSource.asObservable();

  notifyContractsUpdated() {
    this.contractsUpdatedSource.next(true);
  }

}
