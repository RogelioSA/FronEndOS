import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalMarcacionComponent } from './personal-marcacion.component';

describe('PersonalMarcacionComponent', () => {
  let component: PersonalMarcacionComponent;
  let fixture: ComponentFixture<PersonalMarcacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PersonalMarcacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalMarcacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
