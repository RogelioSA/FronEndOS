import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametroActivoServicioComponent } from './parametro-activo-servicio.component';

describe('ParametroActivoServicioComponent', () => {
  let component: ParametroActivoServicioComponent;
  let fixture: ComponentFixture<ParametroActivoServicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParametroActivoServicioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParametroActivoServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
