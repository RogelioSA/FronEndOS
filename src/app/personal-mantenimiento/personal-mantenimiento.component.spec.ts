import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalMantenimientoComponent } from './personal-mantenimiento.component';

describe('PersonalMantenimientoComponent', () => {
  let component: PersonalMantenimientoComponent;
  let fixture: ComponentFixture<PersonalMantenimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PersonalMantenimientoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalMantenimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
