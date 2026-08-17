import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibroControl } from './libro-control';

describe('LibroControl', () => {
  let component: LibroControl;
  let fixture: ComponentFixture<LibroControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibroControl],
    }).compileComponents();

    fixture = TestBed.createComponent(LibroControl);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
