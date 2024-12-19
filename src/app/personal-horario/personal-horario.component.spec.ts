import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalHorarioComponent } from './personal-horario.component';

describe('PersonalHorarioComponent', () => {
  let component: PersonalHorarioComponent;
  let fixture: ComponentFixture<PersonalHorarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PersonalHorarioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalHorarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
