import { of } from 'rxjs';

import { PersonalMarcacionComponent } from './personal-marcacion.component';

describe('PersonalMarcacionComponent', () => {
  let component: PersonalMarcacionComponent;
  let apiService: jasmine.SpyObj<any>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', ['getRegistroAsistenciaPersonal']);
    apiService.getRegistroAsistenciaPersonal.and.returnValue(of([]));
    component = new PersonalMarcacionComponent(apiService);
    component.blockUI = jasmine.createSpyObj('NgBlockUI', ['start', 'stop']);
    component.calcularFechasMes();
  });

  it('avanza y retrocede periodos completos sin depender de la zona horaria', async () => {
    const periodoInicial = component.fechaInicio;
    const [anio, mes] = periodoInicial.split('-').map(Number);
    const siguiente = new Date(anio, mes, 1);
    const inicioSiguiente = component.formatearFechaISO(siguiente);
    const finSiguiente = component.formatearFechaISO(
      new Date(siguiente.getFullYear(), siguiente.getMonth() + 1, 0)
    );

    await component.cambiarMes(1);

    expect(component.fechaInicio).toBe(inicioSiguiente);
    expect(component.fechaFin).toBe(finSiguiente);
    expect(apiService.getRegistroAsistenciaPersonal).toHaveBeenCalledWith(
      component.usuarioId,
      inicioSiguiente,
      `${finSiguiente}T23:59:59`
    );

    await component.cambiarMes(-1);
    expect(component.fechaInicio).toBe(periodoInicial);
  });

  it('limpia filtros, búsqueda, página y datos antes de actualizar', async () => {
    const grid = jasmine.createSpyObj('DataGrid', ['clearFilter', 'searchByText', 'pageIndex']);
    component.dataGrid = { instance: grid } as any;
    component.registrosAsistencia = [{ tipoEvento: 0 }, { tipoEvento: 1 }] as any;
    component.calcularEstadisticas();

    await component.actualizarMarcaciones();

    expect(grid.clearFilter).toHaveBeenCalled();
    expect(grid.searchByText).toHaveBeenCalledWith('');
    expect(grid.pageIndex).toHaveBeenCalledWith(0);
    expect(apiService.getRegistroAsistenciaPersonal).toHaveBeenCalledWith(
      component.usuarioId,
      component.fechaInicio,
      `${component.fechaFin}T23:59:59`
    );
    expect(component.registrosAsistencia).toEqual([]);
    expect(component.totalRegistros).toBe(0);
  });

  it('consulta la fecha final del periodo hasta el final del dia', async () => {
    component.fechaInicio = '2026-09-01';
    component.fechaFin = '2026-09-30';

    await component.cargarRegistros();

    expect(apiService.getRegistroAsistenciaPersonal).toHaveBeenCalledWith(
      component.usuarioId,
      '2026-09-01',
      '2026-09-30T23:59:59'
    );
  });
});
