import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrigenfinancieroComponent } from './origenfinanciero.component';

describe('OrigenfinancieroComponent', () => {
  let component: OrigenfinancieroComponent;
  let fixture: ComponentFixture<OrigenfinancieroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrigenfinancieroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrigenfinancieroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
