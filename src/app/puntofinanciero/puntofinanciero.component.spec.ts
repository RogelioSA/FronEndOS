import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuntofinancieroComponent } from './puntofinanciero.component';

describe('PuntofinancieroComponent', () => {
  let component: PuntofinancieroComponent;
  let fixture: ComponentFixture<PuntofinancieroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PuntofinancieroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PuntofinancieroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
