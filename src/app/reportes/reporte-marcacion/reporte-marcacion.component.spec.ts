import { DatePipe } from '@angular/common';
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
});
