import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ActivateAccountService } from '../services/authentication/activate-account.service';

export const invitationResolver: ResolveFn<boolean> = (route, state) => {
  const activateAccount = inject(ActivateAccountService);
  return activateAccount.checkInvitation({
    tkn: route.queryParamMap.get('tkn'),
    ref: route.queryParamMap.get('ref'),
    mode: route.queryParamMap.get('mode'),
    ts: route.queryParamMap.get('ts'),
    code: route.queryParamMap.get('code'),
  });
};
