import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivoServicioComponent } from './activo-servicio.component';

describe('ActivoServicioComponent', () => {
  let component: ActivoServicioComponent;
  let fixture: ComponentFixture<ActivoServicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActivoServicioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActivoServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
