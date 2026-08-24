import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

interface OrdenTrabajo {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: number;
}

@Component({
  selector: 'app-marcacionespecifica',
  standalone: false,
  templateUrl: './marcacionespecifica.component.html',
  styleUrl: './marcacionespecifica.component.css'
})
export class MarcacionespecificaComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  ordenesTrabajo: OrdenTrabajo[] = [];
  ordenTrabajoId: number | null = null;
  observacion = '';
  latitude = 0;
  longitude = 0;
  coordinates = '';
  cameraError = '';
  locationError = '';
  isLoadingOrders = false;
  isProcessing = false;
  mensaje = '';
  esError = false;

  private stream: MediaStream | null = null;
  private locationWatchId: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.initCamera(), this.cargarOrdenesTrabajo()]);
    this.initLocation();
  }

  ngOnDestroy(): void {
    this.stream?.getTracks().forEach(track => track.stop());
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
    }
  }

  async initCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraError = 'La cámara no está disponible en este navegador.';
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      this.videoElement.nativeElement.srcObject = this.stream;
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      this.cameraError = 'No se pudo acceder a la cámara. Revise los permisos del navegador.';
    }
  }

  initLocation(): void {
    if (!navigator.geolocation) {
      this.locationError = 'La geolocalización no está disponible en este navegador.';
      return;
    }

    this.locationWatchId = navigator.geolocation.watchPosition(
      position => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.coordinates = `${this.latitude.toFixed(7)}, ${this.longitude.toFixed(7)}`;
        this.locationError = '';
      },
      error => {
        console.error('Error al obtener la ubicación:', error);
        this.locationError = 'Debe permitir el acceso a su ubicación para registrar la marcación.';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async cargarOrdenesTrabajo(): Promise<void> {
    this.isLoadingOrders = true;
    try {
      const response = await firstValueFrom(
        this.apiService.listarOrdenTrabajoCabeceraSimplificado()
      );
      const ordenes = Array.isArray(response) ? response : (response?.data ?? []);
      this.ordenesTrabajo = ordenes.filter(
        (orden: OrdenTrabajo) => Number(orden.estado) === 1
      );
    } catch (error) {
      console.error('Error al cargar órdenes de trabajo:', error);
      this.mostrarMensaje('No se pudieron cargar las órdenes de trabajo.', true);
    } finally {
      this.isLoadingOrders = false;
    }
  }

  async marcarAsistencia(eventoTipo: 0 | 1): Promise<void> {
    if (!this.ordenTrabajoId) {
      this.mostrarMensaje('Seleccione una orden de trabajo antes de marcar.', true);
      return;
    }
    if (!this.observacion.trim()) {
      this.mostrarMensaje('Ingrese una observación antes de marcar.', true);
      return;
    }
    if (!this.coordinates) {
      this.mostrarMensaje('Espere a que se obtenga una ubicación válida.', true);
      return;
    }

    const selfie = this.capturePhoto();
    if (!selfie) {
      this.mostrarMensaje('No se pudo capturar la fotografía. Verifique la cámara.', true);
      return;
    }

    this.isProcessing = true;
    this.mensaje = '';
    try {
      const archivo = this.base64ToFile(selfie, `marcacion_ot_${Date.now()}.jpg`);
      const uploadResponse = await firstValueFrom(this.apiService.subirAdjunto(1, archivo));
      const adjuntoId = Number(uploadResponse?.id);
      if (!adjuntoId) {
        throw new Error('El servicio de adjuntos no devolvió un identificador.');
      }

      const claims = this.authService.getClaims();
      const payload = {
        empresaId: Number(localStorage.getItem('empresa_id')) || 0,
        personalId: Number(claims?.nCodigo) || 0,
        latitud: this.latitude,
        longitud: this.longitude,
        adjuntoId,
        observacion: this.observacion.trim(),
        ordenTrabajoId: Number(this.ordenTrabajoId),
        obseracion: this.observacion.trim(),
        eventoTipo,
        tipoRegularizacion: 1
      };

      console.log('Body enviado a /rrhh/RegistroAsistencia/regularizar:', payload);
      await firstValueFrom(this.apiService.registrarMarcacionEspecifica(payload));
      this.mostrarMensaje(`¡${eventoTipo === 0 ? 'Ingreso' : 'Salida'} registrado correctamente!`, false);
      this.observacion = '';
    } catch (error: any) {
      console.error('Error al registrar la marcación específica:', error);
      this.mostrarMensaje(this.extractErrorMessage(error), true);
    } finally {
      this.isProcessing = false;
    }
  }

  private capturePhoto(): string {
    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;
    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return '';
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  private base64ToFile(base64: string, filename: string): File {
    const [metadata, content] = base64.split(',');
    const mime = metadata.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const binary = atob(content);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    return new File([bytes], filename, { type: mime });
  }

  private extractErrorMessage(error: any): string {
    return error?.error?.detail
      || error?.error?.message
      || (typeof error?.error === 'string' ? error.error : '')
      || error?.message
      || 'No se pudo registrar la marcación. Intente nuevamente.';
  }

  private mostrarMensaje(mensaje: string, esError: boolean): void {
    this.mensaje = mensaje;
    this.esError = esError;
  }
}
