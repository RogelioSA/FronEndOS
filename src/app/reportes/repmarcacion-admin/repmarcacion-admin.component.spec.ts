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

  it('genera columnas únicamente para días laborables', () => {
    component.fechaInicial = new Date(2026, 8, 4);
    component.fechaFinal = new Date(2026, 8, 7);

    (component as any).generarColumnasFechas();

    expect(component.columnasFechas.map(columna => columna.diaSemana)).toEqual(['VIE', 'LUN']);
  });

  it('asigna el área a partir del cargo normalizado', () => {
    expect((component as any).obtenerArea('Jefe de Ingeniería y Desarrollo', {}, {}))
      .toBe('INGENIERIA Y DESARROLLO');
    expect((component as any).obtenerArea('PERSONAL   DE LIMPIEZA', {}, {}))
      .toBe('RECURSOS HUMANOS');
  });

  it('omite del reporte los cargos operativos indicados', () => {
    component.fechaInicial = new Date(2026, 8, 7);
    component.fechaFinal = new Date(2026, 8, 7);
    (component as any).generarColumnasFechas();
    const personal = [
      { persona: { id: 1, nombres: 'Ana' }, personalCargoExterno: { cargoId: 10 } },
      { persona: { id: 2, nombres: 'Luis' }, personalCargoExterno: { cargoId: 20 } }
    ];
    const cargos = [
      { id: 10, nombre: 'TÉCNICO' },
      { id: 20, nombre: 'JEFE COMERCIAL' }
    ];
    const marcaciones = personal.map(detalle => ({
      personalId: detalle.persona.id,
      persona: detalle.persona,
      personalCargoExterno: detalle.personalCargoExterno,
      ordenTrabajo: { id: null },
      fechaJornal: '2026-09-07',
      fecha: '2026-09-07T08:00:00',
      tipoEvento: 0
    }));

    (component as any).procesarDatos(marcaciones, [], personal, cargos);

    expect(component.empleados.length).toBe(1);
    expect(component.empleados[0].cargo).toBe('JEFE COMERCIAL');
    expect(component.empleados[0].area).toBe('COMERCIAL');
  });
});
