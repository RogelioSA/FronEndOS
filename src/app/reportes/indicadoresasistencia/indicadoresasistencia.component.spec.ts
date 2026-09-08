import { DatePipe } from '@angular/common';
import { IndicadoresAsistenciaComponent } from './indicadoresasistencia.component';

describe('IndicadoresAsistenciaComponent', () => {
  it('aplica los límites del semáforo solicitados', () => {
    const componente = new IndicadoresAsistenciaComponent({} as any, new DatePipe('es-PE'));
    expect(componente.claseSemaforo(79.99)).toBe('semaforo-rojo');
    expect(componente.claseSemaforo(80)).toBe('semaforo-ambar');
    expect(componente.claseSemaforo(95)).toBe('semaforo-ambar');
    expect(componente.claseSemaforo(95.01)).toBe('semaforo-verde');
  });

  it('inicializa la fecha final con la fecha actual como límite máximo', () => {
    const componente = new IndicadoresAsistenciaComponent({} as any, new DatePipe('es-PE'));
    expect(componente.fechaFinal.getTime()).toBe(componente.fechaMaxima.getTime());
    expect(componente.fechaMaxima.getHours()).toBe(0);
  });

  it('descuenta ausencias de las esperadas y cuenta todas las marcaciones realizadas', () => {
    const componente = new IndicadoresAsistenciaComponent({} as any, new DatePipe('es-PE'));
    componente.fechaInicial = new Date(2026, 0, 5);
    componente.fechaFinal = new Date(2026, 0, 6);
    const personal = [
      { persona: { id: 1, estado: true }, personalCargoExterno: { cargoId: 10 } },
      { persona: { id: 2, estado: true }, personalCargoExterno: { cargoId: 20 } }
    ];
    const cargos = [{ id: 10, nombre: 'ASISTENTE DE CONTABILIDAD' }, { id: 20, nombre: 'TECNICO' }];
    const asignaciones = [
      { personalId: 2, fecha: '2026-01-05', ordenConsultadaId: 100 },
      { personalId: 2, fecha: '2026-01-06', ordenConsultadaId: 100 }
    ];
    const ausencias = [
      { personalId: 1, fecha: '2026-01-05', horarioCabecera: { nombre: 'LP' } },
      { personalId: 2, fecha: '2026-01-06', horarioCabecera: { nombre: 'PSG' } }
    ];
    const marcaciones = [
      { personalId: 1, fecha: '2026-01-06T08:00:00', fechaJornal: '2026-01-06', tipoEvento: 0 },
      { personalId: 1, fecha: '2026-01-06T08:05:00', fechaJornal: '2026-01-06', tipoEvento: 0 },
      { personalId: 1, fecha: '2026-01-06T17:00:00', fechaJornal: '2026-01-06', tipoEvento: 1 }
    ];

    (componente as any).procesar(marcaciones, personal, cargos, asignaciones, ausencias);

    expect(componente.total.marcacionesEsperadas).toBe(4);
    expect(componente.total.marcacionesRealizadas).toBe(3);
  });
});
