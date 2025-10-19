import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UbicacionTecnicaComponent } from './ubicacion-tecnica.component';

describe('UbicacionTecnicaComponent', () => {
  let component: UbicacionTecnicaComponent;
  let fixture: ComponentFixture<UbicacionTecnicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UbicacionTecnicaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UbicacionTecnicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
