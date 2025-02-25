import { TestBed } from '@angular/core/testing';

import { CentralSaveService } from './central-save.service';

describe('CentralSaveService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CentralSaveService = TestBed.get(CentralSaveService);
    expect(service).toBeTruthy();
  });
});
