import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { DxButtonModule, DxDateBoxModule } from 'devextreme-angular';
import { ApiService } from '../../services/api.service';
import { RepmarcacionAdminComponent } from './repmarcacion-admin.component';

describe('RepmarcacionAdminComponent', () => {
  let fixture: ComponentFixture<RepmarcacionAdminComponent>;
  let component: RepmarcacionAdminComponent;
  const api = {
    getRegistroAsistencia: () => of([]),
    obtenerHorariosPorOrdenYRango: () => of([]),
    getPersonalDetalle: () => of([]),
    getCargos: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RepmarcacionAdminComponent],
      imports: [FormsModule, DxButtonModule, DxDateBoxModule],
      providers: [{ provide: ApiService, useValue: api }]
    }).compileComponents();
    fixture = TestBed.createComponent(RepmarcacionAdminComponent);
    component = fixture.componentInstance;
  });

  it('crea el reporte administrativo', () => {
    expect(component).toBeTruthy();
  });

  it('rechaza un rango de fechas invertido', async () => {
    component.fechaInicial = new Date(2026, 8, 8);
    component.fechaFinal = new Date(2026, 8, 7);
    await component.buscar();
    expect(component.mensaje).toContain('fecha inicial');
  });
});
