import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { invitationResolverResolver } from './invitation-resolver.resolver';

describe('invitationResolverResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => invitationResolverResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
