import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalSituacionComponent } from './personal-situacion.component';

describe('PersonalSituacionComponent', () => {
  let component: PersonalSituacionComponent;
  let fixture: ComponentFixture<PersonalSituacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PersonalSituacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalSituacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
