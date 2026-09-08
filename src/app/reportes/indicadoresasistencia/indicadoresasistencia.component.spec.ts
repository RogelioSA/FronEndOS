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
});
