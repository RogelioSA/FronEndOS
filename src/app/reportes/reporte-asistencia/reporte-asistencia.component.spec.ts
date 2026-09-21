import { DatePipe } from '@angular/common';
import { of } from 'rxjs';

import { ReporteAsistenciaComponent } from './reporte-asistencia.component';

describe('ReporteAsistenciaComponent', () => {
  let component: ReporteAsistenciaComponent;
  let apiService: jasmine.SpyObj<any>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', [
      'listarOrdenTrabajoCabeceraSimplificado'
    ]);
    apiService.listarOrdenTrabajoCabeceraSimplificado.and.returnValue(of([]));
    component = new ReporteAsistenciaComponent(apiService, new DatePipe('es-PE'));
  });

  it('muestra una alerta y no consulta sin una orden de trabajo', async () => {
    spyOn(component, 'showMessage');
    spyOn(component, 'traerMarcaciones').and.resolveTo();

    await component.buscar();

    expect(component.showMessage).toHaveBeenCalledWith(
      'Seleccione una orden de trabajo antes de buscar'
    );
    expect(component.traerMarcaciones).not.toHaveBeenCalled();
  });

  it('lista solo órdenes activas, omite Oficina y las ordena alfabéticamente', async () => {
    apiService.listarOrdenTrabajoCabeceraSimplificado.and.returnValue(of([
      { id: 3, estado: 1, nombre: 'Zulu', descripcion: 'Tres' },
      { id: 2, estado: 0, nombre: 'Activa', descripcion: 'Inactiva' },
      { id: 1, estado: 1, nombre: 'Álamo', descripcion: 'Uno' }
    ]));

    await component.cargarOrdenesTrabajo();

    expect(component.ordenesTrabajo.map((orden) => orden.id)).toEqual([1, 3]);
    expect(component.ordenesTrabajo.some((orden) => orden.cOrdenInterna === 'OFICINA')).toBeFalse();
  });
});
