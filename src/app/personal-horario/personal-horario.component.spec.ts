import { of } from 'rxjs';
import { PersonalHorarioComponent } from './personal-horario.component';
import {
  consolidarRespuestaHorariosAsignados,
  seleccionarUltimosHorariosAsignados
} from '../utils/orden-trabajo-horario.utils';

describe('seleccionarUltimosHorariosAsignados', () => {
  it('conserva el registro con mayor id por orden, personal y fecha', () => {
    const resultado = seleccionarUltimosHorariosAsignados([
      { id: 66066, ordenTrabajoCabeceraId: 32, personalId: 279, fecha: '2026-10-03', horarioCabeceraId: 2 },
      { id: 66070, ordenTrabajoCabeceraId: 32, personalId: 279, fecha: '2026-10-03', horarioCabeceraId: 4 },
      { id: 66064, ordenTrabajoCabeceraId: 32, personalId: 269, fecha: '2026-10-03', horarioCabeceraId: 3 },
      { id: 66072, ordenTrabajoCabeceraId: 32, personalId: 269, fecha: '2026-10-03', horarioCabeceraId: 4 }
    ]);

    expect(resultado).toEqual([
      { id: 66070, ordenTrabajoCabeceraId: 32, personalId: 279, fecha: '2026-10-03', horarioCabeceraId: 4 },
      { id: 66072, ordenTrabajoCabeceraId: 32, personalId: 269, fecha: '2026-10-03', horarioCabeceraId: 4 }
    ]);
  });

  it('no agrupa registros de órdenes o fechas distintas', () => {
    const resultado = seleccionarUltimosHorariosAsignados([
      { id: 10, ordenTrabajoCabeceraId: 32, personalId: 279, fecha: '2026-10-03' },
      { id: 11, ordenTrabajoCabeceraId: 33, personalId: 279, fecha: '2026-10-03' },
      { id: 12, ordenTrabajoCabeceraId: 32, personalId: 279, fecha: '2026-10-04' }
    ]);

    expect(resultado.length).toBe(3);
  });

  it('consolida también las respuestas que contienen la lista en data', () => {
    const respuesta = consolidarRespuestaHorariosAsignados({
      data: [
        { id: 20, ordenTrabajoCabeceraId: 32, personalId: 279, fecha: '2026-10-03' },
        { id: 21, ordenTrabajoCabeceraId: 32, personalId: 279, fecha: '2026-10-03' }
      ],
      total: 2
    });

    expect(respuesta.total).toBe(2);
    expect(respuesta.data).toEqual([
      { id: 21, ordenTrabajoCabeceraId: 32, personalId: 279, fecha: '2026-10-03' }
    ]);
  });
});

describe('actualización unitaria de horario', () => {
  it('envía fechaVigencia y actualiza el registro vigente', async () => {
    const actualizarOrdenTrabajoHorario = jasmine.createSpy().and.returnValue(of({ id: 66070 }));
    const component = Object.create(PersonalHorarioComponent.prototype) as PersonalHorarioComponent;
    Object.assign(component, {
      empresaId: 1,
      ordenCombo: 32,
      ordenTrabajoHorarioIds: new Map([['279_2026-10-03', 66070]]),
      apiService: { actualizarOrdenTrabajoHorario }
    });

    await (component as any).persistirHorarioIndividual(279, new Date(2026, 9, 3), 4);

    expect(actualizarOrdenTrabajoHorario).toHaveBeenCalledWith(
      66070,
      jasmine.objectContaining({
        ordenTrabajoCabeceraId: 32,
        personalId: 279,
        fecha: '2026-10-03',
        horarioCabeceraId: 4,
        fechaVigencia: jasmine.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}-05:00$/)
      })
    );
  });
});
