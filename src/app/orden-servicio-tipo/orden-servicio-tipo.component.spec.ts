import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdenServicioTipoComponent } from './orden-servicio-tipo.component';

describe('OrdenServicioTipoComponent', () => {
  let component: OrdenServicioTipoComponent;
  let fixture: ComponentFixture<OrdenServicioTipoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrdenServicioTipoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdenServicioTipoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
