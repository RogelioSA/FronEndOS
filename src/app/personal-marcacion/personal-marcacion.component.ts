import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

// Declarar Leaflet para TypeScript
declare var L: any;

interface RegistroAsistencia {
  empresaId: number;
  id: number;
  personalId: number;
  fecha: string;
  fechaJornal: string;
  ordenTrabajoCabecera?: { id?: number; nombre?: string } | null;
  registroAsistenciaOrdenTrabajo?: {
    ordenTrabajoCabeceraId?: number;
    ordenTrabajoCabecera?: RegistroAsistencia['ordenTrabajoCabecera'];
  } | null;
  registroAsistenciaAdjuntos?: { adjuntoId: number; tipo: number }[] | null;
  tipoEvento: number;
  esTardanza: boolean;
  diferenciaMinutos: number;
  latitud: number | null;
  longitud: number | null;
  horarioDetalleEventoId: number;
  registroAsistenciaPoliticaId: number;
  horarioDetalleEvento: {
    hora: string;
    tipoEvento: number;
  };
}

interface TramoJornal {
  orden: string;
  entrada?: RegistroAsistencia;
  salida?: RegistroAsistencia;
  total: string;
}

interface JornalMarcaciones {
  fecha: string;
  tramos: TramoJornal[];
  otrosEventos: RegistroAsistencia[];
}

@Component({
  selector: 'app-personal-marcacion',
  standalone: false,
  templateUrl: './personal-marcacion.component.html',
  styleUrl: './personal-marcacion.component.css'
})
export class PersonalMarcacionComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  @ViewChild('dialogoFirma') private dialogoFirma!: ElementRef<HTMLDialogElement>;
  @ViewChild('dialogoFirmaGuardada') private dialogoFirmaGuardada!: ElementRef<HTMLDialogElement>;
  @ViewChild('lienzoFirma') private lienzoFirma!: ElementRef<HTMLCanvasElement>;

  jornales: JornalMarcaciones[] = [];
  jornalFirma = '';
  aceptaFirma = false;
  tieneFirma = false;
  guardandoFirma = false;
  errorFirma = '';
  jornalesFirmados = new Map<string, number>();
  firmaGuardada: { fecha: string; url: string; cargando: boolean; error: boolean } | null = null;
  private punteroFirma: number | null = null;
  private adjuntoFirmaId: number | null = null;

  registrosAsistencia: RegistroAsistencia[] = [];
  usuarioId: string = '0';
  fechaInicio: string = '';
  fechaFin: string = '';
  mesActual: string = '';
  cargando: boolean = false;
  private periodoActual: Date = new Date();
  
  // Variables para estadísticas
  totalRegistros: number = 0;
  registrosEntrada: number = 0;
  registrosSalida: number = 0;
  totalTardanzas: number = 0;
  minutosAcumulados: number = 0;

  // Variables para el mapa
  mostrarModalMapa: boolean = false;
  coordenadasSeleccionadas: { latitud: number | null, longitud: number | null } = { 
    latitud: null, 
    longitud: null 
  };
  map: any = null;

  // Lookup para tipo de evento
  tiposEvento = [
    { value: 0, text: 'Entrada', icon: 'bi-box-arrow-in-right', color: 'success' },
    { value: 1, text: 'Salida', icon: 'bi-box-arrow-right', color: 'danger' },
    { value: 2, text: 'Refrigerio Inicio', icon: 'bi-cup-hot', color: 'info' },
    { value: 3, text: 'Refrigerio Fin', icon: 'bi-cup-hot-fill', color: 'info' }
  ];

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    this.calcularFechasMes();
    await this.cargarRegistros();
  }

  obtenerUsuarioId() { // Renombrado y simplificado
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
      console.error('❌ No se encontró user_id en localStorage');
      alert('No se pudo obtener el ID del usuario');
      return;
    }

    this.usuarioId = userId; // Ya no se parsea a número
    console.log('✅ Usuario ID obtenido:', this.usuarioId);
  }

  calcularFechasMes() {
    const ahora = new Date();
    this.periodoActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    this.actualizarPeriodoSeleccionado();
  }

  private actualizarPeriodoSeleccionado() {
    const year = this.periodoActual.getFullYear();
    const month = this.periodoActual.getMonth();

    this.fechaInicio = this.formatearFechaISO(new Date(year, month, 1));
    this.fechaFin = this.formatearFechaISO(new Date(year, month + 1, 0));
    this.mesActual = this.periodoActual.toLocaleDateString('es-ES', {
      month: 'long', 
      year: 'numeric' 
    });
  }

  formatearFechaISO(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async cargarRegistros() {
    if (!this.usuarioId) { // Cambiado de personalId
      console.error('❌ No hay usuarioId para cargar registros');
      return;
    }

    try {
      this.cargando = true;
      this.blockUI.start('Cargando registros de asistencia...');

      const response = await firstValueFrom(
        this.apiService.getRegistroAsistenciaPersonal(
          this.usuarioId, // Cambiado de this.personalId
          this.fechaInicio,
          `${this.fechaFin}T23:59:59`
        )
      );

      console.log('✅ Registros de asistencia obtenidos:', response);
      
      this.registrosAsistencia = Array.isArray(response) ? response : [];
      this.calcularEstadisticas();
      this.agruparJornales();
    } catch (error) {
      console.error('❌ Error al cargar registros:', error);
      alert('Error al cargar los registros de asistencia');
    } finally {
      this.cargando = false;
      this.blockUI.stop();
    }
  }
  calcularEstadisticas() {
    this.totalRegistros = this.registrosAsistencia.length;
    
    this.registrosEntrada = this.registrosAsistencia.filter(
      r => r.tipoEvento === 0
    ).length;
    
    this.registrosSalida = this.registrosAsistencia.filter(
      r => r.tipoEvento === 1
    ).length;

    this.totalTardanzas = this.registrosAsistencia.filter(
      r => r.esTardanza
    ).length;

    this.minutosAcumulados = this.registrosAsistencia
      .filter(r => r.esTardanza)
      .reduce((sum, r) => sum + r.diferenciaMinutos, 0);
  }

  async cambiarMes(direccion: number) {
    if (this.cargando || !Number.isInteger(direccion) || direccion === 0) return;

    this.periodoActual = new Date(
      this.periodoActual.getFullYear(),
      this.periodoActual.getMonth() + direccion,
      1
    );
    this.actualizarPeriodoSeleccionado();
    await this.cargarRegistros();
  }

  async actualizarMarcaciones() {
    if (this.cargando) return;

    this.registrosAsistencia = [];
    this.calcularEstadisticas();
    this.jornales = [];
    await this.cargarRegistros();
  }

  private agruparJornales(): void {
    const porJornal = new Map<string, RegistroAsistencia[]>();
    this.jornalesFirmados.clear();
    for (const registro of this.registrosAsistencia) {
      const fecha = registro.fechaJornal?.slice(0, 10) ?? '';
      const registros = porJornal.get(fecha) ?? [];
      registros.push(registro);
      porJornal.set(fecha, registros);
      const firma = registro.registroAsistenciaAdjuntos?.find(
        adjunto => adjunto?.tipo === 3 && Number.isSafeInteger(adjunto.adjuntoId) && adjunto.adjuntoId > 0
      );
      if (fecha && firma && !this.jornalesFirmados.has(fecha)) {
        this.jornalesFirmados.set(fecha, firma.adjuntoId);
      }
    }

    this.jornales = [...porJornal.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([fecha, registros]) => {
      const tramos: TramoJornal[] = [];
      const otrosEventos: RegistroAsistencia[] = [];
      const pendientesPorOrden = new Map<string, TramoJornal[]>();
      registros.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime() || a.id - b.id);

      for (const registro of registros) {
        const relacion = registro.registroAsistenciaOrdenTrabajo;
        const cabecera = relacion?.ordenTrabajoCabecera ?? registro.ordenTrabajoCabecera;
        const orden = cabecera?.nombre?.trim() || '—';
        const claveOrden = String(relacion?.ordenTrabajoCabeceraId ?? cabecera?.id ?? orden);
        const pendientes = pendientesPorOrden.get(claveOrden) ?? [];
        if (registro.tipoEvento === 0) {
          const tramo = { orden, entrada: registro, total: '—' };
          tramos.push(tramo);
          pendientes.push(tramo);
          pendientesPorOrden.set(claveOrden, pendientes);
        } else if (registro.tipoEvento === 1) {
          const tramo = pendientes.shift();
          if (tramo?.entrada) {
            tramo.salida = registro;
            tramo.total = this.formatearDuracion(tramo.entrada.fecha, registro.fecha);
          } else {
            tramos.push({ orden, salida: registro, total: '—' });
          }
        } else {
          otrosEventos.push(registro);
        }
      }
      return { fecha, tramos, otrosEventos };
    });
  }

  private formatearDuracion(entrada: string, salida: string): string {
    const diferencia = new Date(salida).getTime() - new Date(entrada).getTime();
    if (!Number.isFinite(diferencia) || diferencia < 0) return '—';
    const segundos = Math.floor(diferencia / 1000) - (diferencia > 8 * 3600 * 1000 ? 3600 : 0);
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor(segundos / 60) % 60;
    const resto = segundos % 60;
    return [horas && `${horas} h`, minutos && `${minutos} min`, resto && `${resto} s`].filter(Boolean).join(' ') || '0 min';
  }

  formatearFechaHora(fecha?: string): string {
    if (!fecha) return '—';
    const date = new Date(fecha);
    return date.toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  formatearFechaJornal(value?: string | null): string {
    const fecha = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value ?? '');
    if (!fecha) return 'N/A';
    const [, anio, mes, dia] = fecha;
    return `${dia}/${mes}/${anio}`;
  }

  abrirFirma(fecha: string): void {
    if (this.jornalesFirmados.has(fecha) || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return;
    this.jornalFirma = fecha;
    this.aceptaFirma = false;
    this.limpiarFirma();
    this.dialogoFirma.nativeElement.showModal();
    const canvas = this.lienzoFirma.nativeElement;
    const { width, height } = canvas.getBoundingClientRect();
    const escala = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * escala));
    canvas.height = Math.max(1, Math.round(height * escala));
  }

  cerrarFirma(): void {
    if (!this.guardandoFirma) this.dialogoFirma.nativeElement.close();
  }

  cancelarFirma(evento: Event): void {
    if (this.guardandoFirma) evento.preventDefault();
  }

  limpiarFirma(): void {
    const canvas = this.lienzoFirma.nativeElement;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    this.punteroFirma = null;
    this.tieneFirma = false;
    this.adjuntoFirmaId = null;
    this.errorFirma = '';
  }

  dibujarFirma(evento: PointerEvent): void {
    if (this.guardandoFirma) return;
    const inicio = evento.type === 'pointerdown';
    if (inicio ? this.punteroFirma !== null || evento.button !== 0 : this.punteroFirma !== evento.pointerId) return;

    const canvas = this.lienzoFirma.nativeElement;
    const contexto = canvas.getContext('2d');
    if (!contexto) return;
    const rect = canvas.getBoundingClientRect();
    const x = (evento.clientX - rect.left) * canvas.width / rect.width;
    const y = (evento.clientY - rect.top) * canvas.height / rect.height;
    if (inicio) {
      this.punteroFirma = evento.pointerId;
      canvas.setPointerCapture(evento.pointerId);
      contexto.beginPath();
      contexto.moveTo(x, y);
      return;
    }

    contexto.lineCap = 'round';
    contexto.lineJoin = 'round';
    contexto.lineWidth = 2.5 * canvas.width / rect.width;
    contexto.strokeStyle = '#182a43';
    contexto.lineTo(x, y);
    contexto.stroke();
    contexto.beginPath();
    contexto.moveTo(x, y);
    this.tieneFirma = true;
    this.adjuntoFirmaId = null;
    this.errorFirma = '';
  }

  finalizarTrazo(evento: PointerEvent): void {
    if (this.punteroFirma === evento.pointerId) this.punteroFirma = null;
  }

  async enviarFirma(): Promise<void> {
    if (!this.jornalFirma || this.jornalesFirmados.has(this.jornalFirma)
        || !this.aceptaFirma || !this.tieneFirma || this.guardandoFirma) return;

    this.guardandoFirma = true;
    this.errorFirma = '';
    try {
      if (this.adjuntoFirmaId === null) {
        const imagen = await new Promise<Blob | null>(resolve => this.lienzoFirma.nativeElement.toBlob(resolve, 'image/png'));
        if (!imagen) throw new Error('No se pudo generar la imagen de la firma');
        const archivo = new File([imagen], `firma-jornal-${this.jornalFirma}.png`, { type: 'image/png' });
        const respuesta = await firstValueFrom(this.apiService.subirAdjunto(1, archivo));
        const id = Number(respuesta?.id);
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error('El adjunto no devolvió un ID válido');
        this.adjuntoFirmaId = id;
      }

      await firstValueFrom(this.apiService.registrarFirmasAsistencia([
        { fecha: `${this.jornalFirma}T00:00:00.000Z`, adjuntoId: this.adjuntoFirmaId }
      ]));
      this.jornalesFirmados.set(this.jornalFirma, this.adjuntoFirmaId);
      this.dialogoFirma.nativeElement.close();
    } catch {
      this.errorFirma = 'No se pudo guardar la firma. Intenta enviarla nuevamente.';
    } finally {
      this.guardandoFirma = false;
    }
  }

  async verFirmaGuardada(fecha: string): Promise<void> {
    const adjuntoId = this.jornalesFirmados.get(fecha);
    if (adjuntoId == null) return;
    const vista = { fecha, url: '', cargando: true, error: false };
    this.firmaGuardada = vista;
    this.dialogoFirmaGuardada.nativeElement.showModal();

    try {
      const url = await firstValueFrom(this.apiService.obtenerAdjuntoImagen(adjuntoId));
      if (this.firmaGuardada === vista) {
        vista.url = typeof url === 'string' ? url.trim() : '';
        vista.error = !vista.url;
      }
    } catch {
      if (this.firmaGuardada === vista) vista.error = true;
    } finally {
      if (this.firmaGuardada === vista) vista.cargando = false;
    }
  }

  cerrarFirmaGuardada(): void {
    this.firmaGuardada = null;
    this.dialogoFirmaGuardada.nativeElement.close();
  }

  firmaGuardadaNoDisponible(): void {
    if (this.firmaGuardada) this.firmaGuardada.error = true;
  }

  obtenerNombreTipoEvento(tipoEvento: number): string {
    const tipo = this.tiposEvento.find(t => t.value === tipoEvento);
    return tipo ? tipo.text : 'Desconocido';
  }

  tieneUbicacion(registro: RegistroAsistencia): boolean {
    return Number.isFinite(registro.latitud) && Number.isFinite(registro.longitud);
  }

  mostrarMapa(rowData: RegistroAsistencia): void {
    if (!this.tieneUbicacion(rowData)) return;

    this.coordenadasSeleccionadas = {
      latitud: rowData.latitud,
      longitud: rowData.longitud
    };

    this.mostrarModalMapa = true;

    setTimeout(() => {
      if (this.mostrarModalMapa) this.inicializarMapa();
    }, 100);
  }

  inicializarMapa() {
    const lat = this.coordenadasSeleccionadas.latitud;
    const lng = this.coordenadasSeleccionadas.longitud;

    if (lat == null || lng == null) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('map').setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(`<b>Ubicación de marcación</b><br>Lat: ${lat}<br>Lng: ${lng}`)
      .openPopup();
  }

  cerrarMapa() {
    this.mostrarModalMapa = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

}
