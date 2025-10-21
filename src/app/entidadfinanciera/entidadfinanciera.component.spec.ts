import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntidadfinancieraComponent } from './entidadfinanciera.component';

describe('EntidadfinancieraComponent', () => {
  let component: EntidadfinancieraComponent;
  let fixture: ComponentFixture<EntidadfinancieraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntidadfinancieraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntidadfinancieraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
