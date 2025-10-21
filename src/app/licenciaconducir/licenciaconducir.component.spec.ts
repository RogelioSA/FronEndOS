import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenciaconducirComponent } from './licenciaconducir.component';

describe('LicenciaconducirComponent', () => {
  let component: LicenciaconducirComponent;
  let fixture: ComponentFixture<LicenciaconducirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LicenciaconducirComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LicenciaconducirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
