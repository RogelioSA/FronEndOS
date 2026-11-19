import { DatePipe } from '@angular/common';
import { Workbook } from 'exceljs';
import { of } from 'rxjs';

import { ReporteMarcacionComponent } from './reporte-marcacion.component';
import { MantoMarcacionesComponent } from '../manto-marcaciones/manto-marcaciones.component';

describe('ReporteMarcacionComponent', () => {
  let component: ReporteMarcacionComponent;
  let apiService: jasmine.SpyObj<any>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', [
      'regularizarRegistroAsistencia',
      'registrarMarcacionEspecifica',
      'getRegistroAsistencia',
      'obtenerAdjuntoImagen',
      'listarOrdenTrabajoCabeceraSimplificado'
    ]);
    apiService.regularizarRegistroAsistencia.and.returnValue(of({}));
    apiService.registrarMarcacionEspecifica.and.returnValue(of({ id: 201 }));
    apiService.getRegistroAsistencia.and.returnValue(of([]));
    apiService.obtenerAdjuntoImagen.and.returnValue(of('foto.jpg'));
    apiService.listarOrdenTrabajoCabeceraSimplificado.and.returnValue(of([]));
    localStorage.setItem('auth_token', 'eyJhbGciOiJub25lIn0.eyJjVXN1YXJpbyI6ImpwZXJleiJ9.');

    component = new ReporteMarcacionComponent(apiService, new DatePipe('es-PE'));
    component.blockUI = jasmine.createSpyObj('BlockUI', ['start', 'stop']);
    spyOn(component, 'traerMarcaciones').and.resolveTo();
  });

  it('no consulta marcaciones automáticamente al iniciar', async () => {
    await component.ngOnInit();

    expect(component.traerMarcaciones).not.toHaveBeenCalled();
  });

  it('mantiene OFICINA disponible cuando se usa el reporte original directamente', async () => {
    apiService.listarOrdenTrabajoCabeceraSimplificado.and.returnValue(of([
      { id: 24, estado: 1, nombre: 'OT 24', descripcion: 'Servicio' }
    ]));

    await component.cargarOrdenesTrabajo();

    expect(component.ordenesTrabajo).toEqual(jasmine.arrayContaining([
      jasmine.objectContaining({ id: 0, cOrdenInterna: 'OFICINA' }),
      jasmine.objectContaining({ id: 24, cOrdenInterna: 'OT 24 - Servicio' })
    ]));
  });

  it('regulariza la marcación con la orden seleccionada y el usuario del token', async () => {
    component.abrirDetalleDatosMarcacion(
      { personal: 'Ana Pérez', dni: '12345678', personalId: 15 } as any,
      {
        id: 199,
        empresaId: 2,
        personalId: 15,
        fecha: '2026-09-11T17:46:24.037Z',
        fechaJornal: '2026-09-11',
        tipoEvento: 99,
        esTardanza: true,
        diferenciaMinutos: 12,
        latitud: -12.04,
        longitud: -77.03,
        adjuntoId: 8
      }
    );
    component.iniciarRegularizacion();
    component.regularizacion.evento = 0;
    component.regularizacion.hora = '08:15:30';
    component.regularizacion.ordenTrabajoId = 24;
    apiService.getRegistroAsistencia.and.returnValue(of([{
      id: 199,
      personalId: 15,
      fecha: '2026-09-11T08:15:30.000Z',
      fechaJornal: '2026-09-11',
      tipoEvento: 0,
      ordenTrabajo: { id: 24, descripcion: 'OT 24' }
    }]));

    await component.regularizarMarcacion();

    expect(apiService.regularizarRegistroAsistencia).toHaveBeenCalledWith({
      registroAsistenciaId: 199,
      observacion: 'actualizado jperez',
      ordenTrabajoId: 24,
      fecha: '2026-09-11T08:15:30.000Z',
      fechaJornal: '2026-09-11',
      eventoTipo: 0
    });
    expect(apiService.registrarMarcacionEspecifica).not.toHaveBeenCalled();
  });

  it('omite la orden de trabajo al editar una marcación de oficina', async () => {
    component.marcaciones = [{
      id: 50,
      personalId: 20,
      fecha: '2026-09-10T08:00:00.000Z',
      fechaJornal: '2026-09-10',
      tipoEvento: 0
    }];
    component.abrirDetalleDatosMarcacion(
      { personal: 'Ana Pérez', dni: '12345678', personalId: 15 } as any,
      {
        id: 200,
        empresaId: 2,
        personalId: 15,
        fecha: '2026-09-11T17:46:24.037Z',
        fechaJornal: '2026-09-11',
        tipoEvento: 1,
        ordenTrabajo: null,
        adjuntoId: 8
      }
    );
    component.iniciarRegularizacion();
    component.regularizacion.hora = '17:30:00';
    apiService.getRegistroAsistencia.and.returnValue(of([{
      id: 200,
      personalId: 15,
      fecha: '2026-09-11T17:30:00.000Z',
      fechaJornal: '2026-09-11',
      tipoEvento: 1,
      ordenTrabajo: null
    }]));

    expect(component.regularizacion.ordenTrabajoId).toBe(0);

    await component.regularizarMarcacion();

    const body = apiService.regularizarRegistroAsistencia.calls.mostRecent().args[0];
    expect(body.registroAsistenciaId).toBe(200);
    expect(body.ordenTrabajoId).toBeUndefined();
    expect(apiService.getRegistroAsistencia).toHaveBeenCalledWith(
      '2026-09-11',
      '2026-09-11T23:59:59'
    );
    expect(component.marcaciones.map((marcacion) => marcacion.id)).toEqual([50, 200]);
    expect(component.traerMarcaciones).not.toHaveBeenCalled();
  });

  it('omite la orden de trabajo al crear una marcación de oficina', async () => {
    localStorage.setItem('empresa_id', '1');
    component.abrirRegularizacionNueva(
      { personal: 'Ana Pérez', dni: '12345678', personalId: 113 } as any,
      '2026-09-28',
      1
    );
    component.regularizacion.hora = '18:00:00';
    component.regularizacion.ordenTrabajoId = 0;
    component.regularizacion.observacion = 'REGULARIZADO';
    apiService.getRegistroAsistencia.and.returnValue(of([{
      id: 201,
      personalId: 113,
      fecha: '2026-09-28T18:00:00.000Z',
      fechaJornal: '2026-09-28',
      tipoEvento: 1,
      ordenTrabajo: null
    }]));

    await component.regularizarMarcacion();

    expect(apiService.registrarMarcacionEspecifica).toHaveBeenCalledWith({
      empresaId: 1,
      personalId: 113,
      fecha: '2026-09-28T18:00:00',
      latitud: 0,
      longitud: 0,
      adjuntoId: 0,
      observacion: 'REGULARIZADO',
      obseracion: 'REGULARIZADO',
      eventoTipo: 1,
      tipoRegularizacion: 0
    });
    expect(apiService.regularizarRegistroAsistencia).not.toHaveBeenCalled();
  });

  it('muestra OFI en la labor del tareo para una marcación sin orden de trabajo', () => {
    const marcacion = {
      eventosPorTipo: {
        0: [{ ordenTrabajo: null }],
        1: [{ ordenTrabajo: null }]
      }
    };

    expect((component as any).obtenerLaborTareo(marcacion, undefined, [])).toBe('OFI');
    expect((component as any).obtenerLaborTareo(marcacion, 'VAC', [])).toBe('VAC');
  });
});

describe('MantoMarcacionesComponent', () => {
  let component: MantoMarcacionesComponent;
  let apiService: jasmine.SpyObj<any>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', [
      'listarOrdenTrabajoCabeceraSimplificado',
      'obtenerAdjuntoImagen'
    ]);
    apiService.listarOrdenTrabajoCabeceraSimplificado.and.returnValue(of([
      { id: 24, estado: 1, nombre: 'OT 24', descripcion: 'Servicio' }
    ]));
    apiService.obtenerAdjuntoImagen.and.returnValue(of('foto.jpg'));
    component = new MantoMarcacionesComponent(apiService, new DatePipe('es-PE'));
  });

  it('excluye OFICINA sin eliminar las órdenes de trabajo seleccionables', async () => {
    await component.cargarOrdenesTrabajo();

    expect(component.ordenesTrabajo).toEqual([
      jasmine.objectContaining({ id: 24, cOrdenInterna: 'OT 24 - Servicio' })
    ]);
    expect(component.ordenesTrabajo.some((orden) => orden.id === 0)).toBeFalse();
  });

  it('permite visualizar una marcación de oficina pero no editarla', () => {
    component.abrirDetalleDatosMarcacion(
      { personal: 'Ana Pérez', dni: '12345678', personalId: 15 } as any,
      {
        id: 200,
        empresaId: 2,
        personalId: 15,
        fecha: '2026-09-11T17:46:24.037Z',
        fechaJornal: '2026-09-11',
        tipoEvento: 1,
        ordenTrabajo: null,
        adjuntoId: 8
      }
    );

    expect(component.mostrarModal).toBeTrue();
    expect(component.detalleMarcacion?.ordenTrabajoId).toBe(0);
    expect(component.puedeEditarDetalleMarcacion()).toBeFalse();

    component.iniciarRegularizacion();

    expect(component.editandoMarcacion).toBeFalse();
  });

  it('conserva la edición para marcaciones con orden de trabajo', () => {
    component.abrirDetalleDatosMarcacion(
      { personal: 'Ana Pérez', dni: '12345678', personalId: 15 } as any,
      {
        id: 201,
        empresaId: 2,
        personalId: 15,
        fecha: '2026-09-11T08:00:00.000Z',
        fechaJornal: '2026-09-11',
        tipoEvento: 0,
        ordenTrabajo: { id: 24 },
        adjuntoId: 8
      }
    );

    expect(component.puedeEditarDetalleMarcacion()).toBeTrue();

    component.iniciarRegularizacion();

    expect(component.editandoMarcacion).toBeTrue();
  });

  it('hereda OFI para la labor del tareo en marcaciones de oficina', () => {
    const marcacion = {
      datosEntrada: { ordenTrabajo: null }
    };

    expect((component as any).obtenerLaborTareo(marcacion, undefined, [])).toBe('OFI');
  });
});

describe('Reporte Tareo con horarios de la OT 53', () => {
  for (const TipoComponente of [ReporteMarcacionComponent, MantoMarcacionesComponent]) {
    it(`exporta CHILE y DCHILE sin marcaciones en ${TipoComponente.name}`, async () => {
      const api = jasmine.createSpyObj('ApiService', [
        'getRegistroAsistencia', 'obtenerHorariosPorOrdenYRango', 'getPersonalDetalle', 'getCargos'
      ]);
      api.getRegistroAsistencia.and.returnValue(of([]));
      api.getPersonalDetalle.and.returnValue(of([
        { persona: { id: 15, documentoIdentidad: '12345678' } }
      ]));
      api.getCargos.and.returnValue(of([]));
      api.obtenerHorariosPorOrdenYRango.and.callFake((ordenId: number) => of({
        data: ordenId === 53 ? [
          { personalId: 15, fecha: '2026-09-01', nombreOt: ' chile ' },
          { personalId: 15, fecha: '2026-09-02', nombreOt: 'DCHILE' }
        ] : [
          { personalId: 16, fecha: '2026-09-01', nombreOt: 'LIC' }
        ]
      }));
      const component = new TipoComponente(api, new DatePipe('en-US'));
      component.blockUI = jasmine.createSpyObj('BlockUI', ['start', 'stop']);
      component.fechaInicial = new Date(2026, 8, 1);
      component.fechaFinal = new Date(2026, 8, 2);
      const descarga = spyOn(URL, 'createObjectURL').and.callThrough();
      spyOn(HTMLAnchorElement.prototype, 'click');

      await component.traerMarcaciones();
      expect(api.obtenerHorariosPorOrdenYRango).toHaveBeenCalledWith(37, '2026-09-01', '2026-09-02');
      expect(api.obtenerHorariosPorOrdenYRango).toHaveBeenCalledWith(53, '2026-09-01', '2026-09-02');
      expect(component.datosReporte.map(empleado => empleado.personalId)).toEqual([16]);

      component.datosReporte = [];
      component.ordenTrabajoSeleccionada = 53;
      expect(component.puedeDescargarTareo).toBeTrue();
      await component.descargarReporteTareo();
      expect(descarga).toHaveBeenCalledTimes(1);
      const archivo = descarga.calls.mostRecent().args[0] as Blob;
      const libro = new Workbook();
      await libro.xlsx.load(await archivo.arrayBuffer());
      const hoja = libro.getWorksheet('Tareo')!;
      expect(hoja.rowCount).toBe(6);
      const fila = hoja.getRow(6);
      expect(fila.getCell('B').value).toBe('12345678');
      expect(fila.getCell('G').value).toBe('CHILE');
      expect(fila.getCell('J').value).toBe('DCHILE');
      for (const columna of ['H', 'I', 'K', 'L', 'P']) {
        expect(fila.getCell(columna).value).toBe('');
      }
      expect(fila.getCell('M').value).toBe(0);

      component.ordenTrabajoSeleccionada = 37;
      expect(component.puedeDescargarTareo).toBeFalse();
      await component.descargarReporteTareo();
      expect(descarga).toHaveBeenCalledTimes(1);
    });
  }
});
