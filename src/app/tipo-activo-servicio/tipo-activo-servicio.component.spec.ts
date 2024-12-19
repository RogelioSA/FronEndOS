import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoActivoServicioComponent } from './tipo-activo-servicio.component';

describe('TipoActivoServicioComponent', () => {
  let component: TipoActivoServicioComponent;
  let fixture: ComponentFixture<TipoActivoServicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TipoActivoServicioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TipoActivoServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
