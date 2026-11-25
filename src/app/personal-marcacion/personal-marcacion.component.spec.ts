import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '../services/api.service';
import { PersonalMarcacionComponent } from './personal-marcacion.component';

describe('PersonalMarcacionComponent', () => {
  let component: PersonalMarcacionComponent;
  let apiService: jasmine.SpyObj<any>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', [
      'getRegistroAsistenciaPersonal', 'subirAdjunto', 'registrarFirmasAsistencia', 'obtenerAdjuntoImagen'
    ]);
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

  it('vuelve a consultar el período y limpia los jornales y estadísticas al actualizar', async () => {
    component.registrosAsistencia = [{ tipoEvento: 0 }, { tipoEvento: 1 }] as any;
    component.jornales = [{ fecha: '2026-11-24', tramos: [], otrosEventos: [] }];
    component.calcularEstadisticas();

    await component.actualizarMarcaciones();

    expect(component.jornales).toEqual([]);
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

  it('muestra el jornal de la API aunque la marcación ocurra al día siguiente', async () => {
    const registro = { fecha: '2026-11-25T01:03:02', fechaJornal: '2026-11-24', tipoEvento: 1 };
    apiService.getRegistroAsistenciaPersonal.and.returnValue(of([registro]));

    await component.cargarRegistros();

    const { fecha, fechaJornal } = component.registrosAsistencia[0];
    expect(component.formatearFechaJornal(fechaJornal)).toBe('24/11/2026');
    expect(component.formatearFechaHora(fecha)).toContain('25/11/2026');
    expect(component.formatearFechaJornal(null)).toBe('N/A');
  });

  it('agrupa por jornal y empareja por orden en secuencia, incluso al cruzar medianoche', async () => {
    const marca = (id: number, fecha: string, tipoEvento: number, nombre: string, fechaJornal = '2026-11-24') => ({
      id, fecha, fechaJornal, tipoEvento, ordenTrabajoCabecera: { nombre }
    });
    apiService.getRegistroAsistenciaPersonal.and.returnValue(of([
      marca(5, '2026-11-25T01:00:00', 1, 'QUE'),
      marca(2, '2026-11-24T08:30:31', 0, 'OFI'),
      marca(1, '2026-11-23T08:30:31', 0, 'OFI', '2026-11-23'),
      marca(4, '2026-11-24T10:30:31', 1, 'OFI'),
      { ...marca(3, '2026-11-24T10:00:00', 0, 'QUE'), latitud: 0, longitud: -77 },
      marca(6, '2026-11-24T12:00:00', 2, 'QUE')
    ]));

    await component.cargarRegistros();

    expect(component.jornales.map(jornal => jornal.fecha)).toEqual(['2026-11-24', '2026-11-23']);
    expect(component.jornales[0].tramos.map(({ orden, entrada, salida, total }) =>
      [orden, entrada?.id, salida?.id, total]
    )).toEqual([['OFI', 2, 4, '2 h'], ['QUE', 3, 5, '14 h']]);
    expect(component.tieneUbicacion(component.jornales[0].tramos[1].entrada!)).toBeTrue();
    expect(component.jornales[0].otrosEventos.map(evento => evento.id)).toEqual([6]);
    expect(component.jornales[1].tramos[0].total).toBe('—');
  });

  it('usa la primera salida cronológica de la OT anidada y deja sin total la salida sobrante', async () => {
    const registroAsistenciaOrdenTrabajo = {
      ordenTrabajoCabeceraId: 51,
      ordenTrabajoCabecera: { id: 51, nombre: 'BAMBAS CW2275191' }
    };
    apiService.getRegistroAsistenciaPersonal.and.returnValue(of([
      { id: 3, fecha: '2026-11-24T20:53:27.238875', tipoEvento: 1 },
      { id: 2, fecha: '2026-11-24T19:00:00', tipoEvento: 1 },
      { id: 1, fecha: '2026-11-24T05:30:36', tipoEvento: 0 }
    ].map(registro => ({ ...registro, fechaJornal: '2026-11-24', registroAsistenciaOrdenTrabajo }))));

    await component.cargarRegistros();

    expect(component.jornales[0].tramos.map(({ entrada, salida, total, orden }) =>
      [entrada?.id, salida?.id, total, orden]
    )).toEqual([
      [1, 2, '12 h 29 min 24 s', 'BAMBAS CW2275191'],
      [undefined, 3, '—', 'BAMBAS CW2275191']
    ]);
  });

  it('descuenta una hora de refrigerio solo al superar ocho horas', async () => {
    apiService.getRegistroAsistenciaPersonal.and.returnValue(of([
      { id: 1, fecha: '2026-11-24T08:00:00', fechaJornal: '2026-11-24', tipoEvento: 0 },
      { id: 2, fecha: '2026-11-24T16:00:00', fechaJornal: '2026-11-24', tipoEvento: 1 },
      { id: 3, fecha: '2026-11-25T08:00:00', fechaJornal: '2026-11-25', tipoEvento: 0 },
      { id: 4, fecha: '2026-11-25T16:00:01', fechaJornal: '2026-11-25', tipoEvento: 1 }
    ]));

    await component.cargarRegistros();

    expect(component.jornales.map(jornal => jornal.tramos[0].total)).toEqual(['7 h 1 s', '8 h']);
  });

  it('envía la firma del jornal con el adjunto y reutiliza el ID si falla el registro', async () => {
    const canvas = document.createElement('canvas');
    const dialogo = document.createElement('dialog');
    const cerrar = spyOn(dialogo, 'close');
    Object.assign(component, {
      lienzoFirma: { nativeElement: canvas },
      dialogoFirma: { nativeElement: dialogo },
      jornalFirma: '2026-11-24',
      tieneFirma: true
    });
    apiService.subirAdjunto.and.returnValue(of({ id: 42 }));
    apiService.registrarFirmasAsistencia.and.returnValues(throwError(() => Error('Error temporal')), of(null));

    await component.enviarFirma();
    expect(apiService.subirAdjunto).not.toHaveBeenCalled();

    component.aceptaFirma = true;
    await component.enviarFirma();
    expect(component.errorFirma).toContain('No se pudo guardar');
    expect(component.jornalesFirmados.has('2026-11-24')).toBeFalse();

    await component.enviarFirma();
    expect(apiService.subirAdjunto).toHaveBeenCalledTimes(1);
    const [modulo, imagen] = apiService.subirAdjunto.calls.mostRecent().args;
    expect(modulo).toBe(1);
    expect(imagen.type).toBe('image/png');
    expect(apiService.registrarFirmasAsistencia).toHaveBeenCalledWith([
      { fecha: '2026-11-24T00:00:00.000Z', adjuntoId: 42 }
    ]);
    expect(component.jornalesFirmados.get('2026-11-24')).toBe(42);
    expect(cerrar).toHaveBeenCalledTimes(1);

    await component.enviarFirma();
    expect(apiService.subirAdjunto).toHaveBeenCalledTimes(1);
    expect(apiService.registrarFirmasAsistencia).toHaveBeenCalledTimes(2);
  });

  it('abre el diálogo desde una tarjeta y habilita el envío tras firmar y aceptar', async () => {
    apiService.getRegistroAsistenciaPersonal.and.returnValue(of([
      { id: 1, fecha: '2026-11-24T08:30:31', fechaJornal: '2026-11-24', tipoEvento: 0, latitud: -12, longitud: -77, ordenTrabajoCabecera: { nombre: 'OFI' }, registroAsistenciaAdjuntos: [] },
      { id: 2, fecha: '2026-11-24T10:30:31', fechaJornal: '2026-11-24', tipoEvento: 1, latitud: -13, longitud: -76, ordenTrabajoCabecera: { nombre: 'OFI' }, registroAsistenciaAdjuntos: [{ adjuntoId: 30, tipo: 1 }] },
      { id: 3, fecha: '2026-11-23T08:30:31', fechaJornal: '2026-11-23', tipoEvento: 0, registroAsistenciaAdjuntos: [{ adjuntoId: 24382, tipo: 3 }] },
      { id: 4, fecha: '2026-11-23T10:30:31', fechaJornal: '2026-11-23', tipoEvento: 1, registroAsistenciaAdjuntos: [{ adjuntoId: 24382, tipo: 3 }] }
    ]));
    await TestBed.configureTestingModule({
      declarations: [PersonalMarcacionComponent],
      providers: [{ provide: ApiService, useValue: apiService }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    const fixture = TestBed.createComponent(PersonalMarcacionComponent);
    fixture.componentInstance.blockUI = jasmine.createSpyObj('NgBlockUI', ['start', 'stop']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const vista: HTMLElement = fixture.nativeElement;
    const tarjeta = vista.querySelector('.jornal-card')!;
    expect(tarjeta.textContent).toContain('24/11/2026');
    expect(tarjeta.textContent).toContain('2 h');
    const mapa = spyOn(fixture.componentInstance, 'mostrarMapa');
    const [entrada, salida] = Array.from(tarjeta.querySelectorAll<HTMLButtonElement>('.marca-mapa'));
    entrada.click();
    salida.click();
    expect(mapa.calls.allArgs().map(([registro]) => [registro.latitud, registro.longitud]))
      .toEqual([[-12, -77], [-13, -76]]);
    tarjeta.querySelector('footer button')!.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();
    const dialogo = vista.querySelector('dialog')!;
    expect(dialogo.open).toBeTrue();
    const rectDialogo = dialogo.getBoundingClientRect();
    const { clientWidth, clientHeight } = document.documentElement;
    expect(rectDialogo.left).toBeCloseTo((clientWidth - rectDialogo.width) / 2, 0);
    expect(rectDialogo.top).toBeCloseTo((clientHeight - rectDialogo.height) / 2, 0);
    const canvas = dialogo.querySelector('canvas')!;
    if (window.matchMedia('(max-width: 600px)').matches) {
      expect(rectDialogo.width).toBe(clientWidth);
      expect(rectDialogo.height).toBe(clientHeight);
      expect(canvas.getBoundingClientRect().height).toBeGreaterThan(rectDialogo.height / 2);
    }
    spyOn(canvas, 'setPointerCapture');
    const { left, top } = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, pointerType: 'touch', button: 0, clientX: left + 20, clientY: top + 20
    }));
    canvas.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, pointerType: 'touch', clientX: left + 45, clientY: top + 35
    }));
    fixture.detectChanges();
    const [enviar, limpiar, cerrar] = Array.from(dialogo.querySelectorAll('button'));
    expect(enviar.disabled).toBeTrue();
    dialogo.querySelector('input')!.click();
    fixture.detectChanges();
    expect(enviar.disabled).toBeFalse();
    limpiar.click();
    fixture.detectChanges();
    expect(enviar.disabled).toBeTrue();
    cerrar.click();
    expect(dialogo.open).toBeFalse();

    const tarjetaFirmada = vista.querySelectorAll('.jornal-card')[1];
    expect(tarjetaFirmada.querySelector('footer button')).toBeNull();
    expect(tarjetaFirmada.querySelectorAll('.estado-firma').length).toBe(1);
    expect(fixture.componentInstance.jornalesFirmados.size).toBe(1);
    const imagenFirma = document.createElement('canvas').toDataURL();
    apiService.obtenerAdjuntoImagen.and.returnValue(of(imagenFirma));
    tarjetaFirmada.querySelector<HTMLButtonElement>('.estado-firma')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const visor = vista.querySelector<HTMLDialogElement>('.firma-guardada-dialog')!;
    expect(visor.open).toBeTrue();
    expect(visor.textContent).toContain('23/11/2026');
    expect(apiService.obtenerAdjuntoImagen).toHaveBeenCalledOnceWith(24382);
    expect(visor.querySelector('img')?.getAttribute('src')).toBe(imagenFirma);
    visor.querySelector('button')!.click();
    expect(visor.open).toBeFalse();
  });
});
