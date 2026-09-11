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

  it('no intenta descargar Excel cuando no hay datos', async () => {
    await component.descargarExcel();

    expect(component.mensaje).toBe('No hay datos para exportar.');
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

  it('incluye asistente de almacén y omite supervisor de seguridad', () => {
    const cargosOmitidos = (component as any).cargosOmitidos as Set<string>;
    expect(cargosOmitidos.has('ASISTENTE DE ALMACEN')).toBeFalse();
    expect(cargosOmitidos.has('INGENIERO DE DESARROLLO')).toBeFalse();
    expect(cargosOmitidos.has('GERENTE DE QHSE Y SGI')).toBeFalse();
    expect(cargosOmitidos.has('SUPERVISOR DE SEGURIDAD')).toBeTrue();

    component.fechaInicial = new Date(2026, 8, 7);
    component.fechaFinal = new Date(2026, 8, 7);
    (component as any).generarColumnasFechas();
    const personal = [
      { persona: { id: 1, nombres: 'Ana' }, personalCargoExterno: { cargoId: 10 } },
      { persona: { id: 2, nombres: 'Luis' }, personalCargoExterno: { cargoId: 20 } },
      { persona: { id: 3, nombres: 'Marta' }, personalCargoExterno: { cargoId: 30 } },
      { persona: { id: 4, nombres: 'José' }, personalCargoExterno: { cargoId: 40 } }
    ];
    const cargos = [
      { id: 10, nombre: 'TÉCNICO' },
      { id: 20, nombre: 'JEFE COMERCIAL' },
      { id: 30, nombre: 'ASISTENTE DE ALMACEN' },
      { id: 40, nombre: 'SUPERVISOR DE SEGURIDAD' }
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

    expect(component.empleados.map(empleado => empleado.cargo)).toEqual(['JEFE COMERCIAL', 'ASISTENTE DE ALMACEN']);
    expect(component.empleados.find(empleado => empleado.cargo === 'ASISTENTE DE ALMACEN')?.area).toBe('ALMACEN');
  });

  it('calcula tardanza contra las 08:00 y no usa diferenciaMinutos', () => {
    component.fechaInicial = new Date(2026, 8, 7);
    component.fechaFinal = new Date(2026, 8, 7);
    (component as any).generarColumnasFechas();
    const persona = { id: 1, nombres: 'Ana' };
    const personal = [{ persona, personalCargoExterno: { cargoId: 20 } }];
    const marcaciones = [
      {
        personalId: persona.id,
        persona,
        personalCargoExterno: { cargoId: 20 },
        ordenTrabajo: { id: null },
        fechaJornal: '2026-09-07',
        fecha: '2026-09-07T07:49:39',
        tipoEvento: 0,
        diferenciaMinutos: 25
      },
      {
        personalId: persona.id,
        persona,
        personalCargoExterno: { cargoId: 20 },
        ordenTrabajo: { id: null },
        fechaJornal: '2026-09-07',
        fecha: '2026-09-07T18:12:00',
        tipoEvento: 1,
        diferenciaMinutos: 13
      }
    ];

    (component as any).procesarDatos(marcaciones, [], personal, [{ id: 20, nombre: 'JEFE COMERCIAL' }]);

    expect(component.empleados[0].dias['2026-09-07'].tardanza).toBe(0);
    expect(component.empleados[0].minutosTardanza).toBe(0);
  });

  it('registra los minutos posteriores a las 08:00 usando el primer ingreso', () => {
    component.fechaInicial = new Date(2026, 8, 7);
    component.fechaFinal = new Date(2026, 8, 7);
    (component as any).generarColumnasFechas();
    const persona = { id: 1, nombres: 'Ana' };
    const personal = [{ persona, personalCargoExterno: { cargoId: 20 } }];
    const crearIngreso = (hora: string, diferenciaMinutos: number) => ({
      personalId: persona.id,
      persona,
      personalCargoExterno: { cargoId: 20 },
      ordenTrabajo: { id: null },
      fechaJornal: '2026-09-07',
      fecha: `2026-09-07T${hora}:00`,
      tipoEvento: 0,
      diferenciaMinutos
    });

    (component as any).procesarDatos(
      [crearIngreso('08:13', -10), crearIngreso('08:05', 100)],
      [],
      personal,
      [{ id: 20, nombre: 'JEFE COMERCIAL' }]
    );

    expect(component.empleados[0].dias['2026-09-07'].entrada).toBe('08:05');
    expect(component.empleados[0].dias['2026-09-07'].tardanza).toBe(5);
    expect(component.empleados[0].minutosTardanza).toBe(5);
  });

  it('muestra en verde la celda TARD. cuando no existe tardanza', () => {
    component.columnasFechas = [{ fecha: '2026-09-07', fechaDisplay: '07/09/2026', diaSemana: 'LUN' }];
    component.empleadosFiltrados = [{
      personalId: 1,
      nombreCompleto: 'Ana',
      documentoIdentidad: '12345678',
      area: 'COMERCIAL',
      cargo: 'JEFE COMERCIAL',
      totalMarcas: 2,
      minutosTardanza: 0,
      totalHorasTrabajadas: 10.28,
      dias: { '2026-09-07': { entrada: '07:55', salida: '18:12', tardanza: 0, ausencia: '', horasTrabajadas: 10.28 } }
    }];

    fixture.detectChanges();

    const celdaTardanza = fixture.nativeElement.querySelector('td.tardanza');
    expect(celdaTardanza.classList).toContain('sin-tardanza');
    expect(celdaTardanza.textContent.trim()).toBe('');
  });

  it('calcula las HH diarias y el Total HH solo con entrada y salida completas', () => {
    component.fechaInicial = new Date(2026, 8, 7);
    component.fechaFinal = new Date(2026, 8, 9);
    (component as any).generarColumnasFechas();
    const persona = { id: 1, nombres: 'Ana' };
    const personal = [{ persona, personalCargoExterno: { cargoId: 20 } }];
    const marca = (fecha: string, hora: string, tipoEvento: number) => ({
      personalId: persona.id,
      persona,
      personalCargoExterno: { cargoId: 20 },
      ordenTrabajo: { id: null },
      fechaJornal: fecha,
      fecha: `${fecha}T${hora}:00`,
      tipoEvento
    });

    (component as any).procesarDatos([
      marca('2026-09-07', '08:00', 0),
      marca('2026-09-07', '16:30', 1),
      marca('2026-09-08', '08:15', 0),
      marca('2026-09-08', '17:00', 1),
      marca('2026-09-09', '08:00', 0)
    ], [], personal, [{ id: 20, nombre: 'JEFE COMERCIAL' }]);

    const empleado = component.empleados[0];
    expect(empleado.dias['2026-09-07'].horasTrabajadas).toBe(8.5);
    expect(empleado.dias['2026-09-08'].horasTrabajadas).toBe(8.75);
    expect(empleado.dias['2026-09-09'].horasTrabajadas).toBe(0);
    expect(empleado.totalHorasTrabajadas).toBe(17.25);
  });
});
