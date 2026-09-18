import { DatePipe } from '@angular/common';
import { of } from 'rxjs';

import { ReporteMarcacionComponent } from './reporte-marcacion.component';

describe('ReporteMarcacionComponent', () => {
  let component: ReporteMarcacionComponent;
  let apiService: jasmine.SpyObj<any>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', [
      'regularizarRegistroAsistencia',
      'registrarMarcacionEspecifica',
      'obtenerAdjuntoImagen',
      'listarOrdenTrabajoCabeceraSimplificado'
    ]);
    apiService.regularizarRegistroAsistencia.and.returnValue(of({}));
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
});
