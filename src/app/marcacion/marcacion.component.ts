import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { AnalogClockComponent } from '../analog-clock/analog-clock.component';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router'; // ✅ Importar Router

@Component({
  selector: 'app-marcacion',
  templateUrl: './marcacion.component.html',
  styleUrl: './marcacion.component.css',
  standalone: false
})
export class MarcacionComponent implements OnInit, OnDestroy {

  @ViewChild('reloj') relojComponent!: AnalogClockComponent;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  hoy: Date = new Date();
  fecha: any;
  claims: any;

  // Variables para la cámara
  stream: MediaStream | null = null;
  capturedImage: string | null = null;

  // Variables para coordenadas
  coordinates: string = '';
  latitude: number = 0;
  longitude: number = 0;

  // Variables para permisos de ubicación
  hasLocationPermission: boolean = false;
  locationPermissionDenied: boolean = false;
  isRequestingLocation: boolean = false;
  locationWatchId: number | null = null;

  // Variables para el estado
  showStatusCard: boolean = false;
  isProcessing: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  statusSteps = {
    uploadingPhoto: 'pending',
    registeringAttendance: 'pending'
  };

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router // ✅ Inyectar Router
  ){

  }

  ngOnInit(){
    this.claims = this.authService.getClaims();
    this.fecha = this.hoy.toLocaleDateString('en-GB');
    this.initCamera();
    this.forceRequestLocationPermission();
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopLocationWatch();
  }

  async initCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      alert('No se pudo acceder a la cámara. Por favor, otorgue los permisos necesarios.');
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  /**
   * Solicita permiso de ubicación al usuario
   */
  async requestLocationPermission() {
    if (!navigator.geolocation) {
      console.error('Geolocalización no soportada por este navegador');
      this.locationPermissionDenied = true;
      this.hasLocationPermission = false;
      return;
    }

    this.isRequestingLocation = true;
    this.locationPermissionDenied = false;

    try {
      // Intentar obtener la ubicación una vez para verificar permisos
      const position = await this.getCurrentPosition();

      // Si llegamos aquí, tenemos permiso
      this.hasLocationPermission = true;
      this.locationPermissionDenied = false;
      this.updateLocationData(position);

      // Iniciar el seguimiento continuo de la ubicación
      this.startLocationWatch();

      console.log('✅ Permiso de ubicación otorgado');
    } catch (error: any) {
      console.error('❌ Error al obtener ubicación:', error);

      // Verificar si fue una denegación de permiso
      if (error.code === 1) { // PERMISSION_DENIED
        this.locationPermissionDenied = true;
        this.hasLocationPermission = false;
        this.coordinates = '';
        console.log('❌ Permiso de ubicación denegado por el usuario');
      } else {
        // Otros errores (timeout, position unavailable, etc.)
        this.hasLocationPermission = false;
        this.coordinates = 'Error al obtener ubicación';
        console.error('Error de geolocalización:', error.message);
      }
    } finally {
      this.isRequestingLocation = false;
    }
  }

  /**
   * Obtiene la posición actual como una promesa
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Inicia el seguimiento continuo de la ubicación
   */
  private startLocationWatch() {
    if (!navigator.geolocation) {
      return;
    }

    // Si ya hay un watch activo, detenerlo primero
    this.stopLocationWatch();

    console.log('🔄 Iniciando seguimiento de ubicación en tiempo real...');

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.updateLocationData(position);
        console.log('📍 Ubicación actualizada:', this.coordinates);
      },
      (error) => {
        console.error('Error en watchPosition:', error);

        if (error.code === 1) { // PERMISSION_DENIED
          this.locationPermissionDenied = true;
          this.hasLocationPermission = false;
          this.stopLocationWatch();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  /**
   * Detiene el seguimiento de ubicación
   */
  private stopLocationWatch() {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
      console.log('⏹️ Seguimiento de ubicación detenido');
    }
  }

  /**
   * Actualiza los datos de ubicación
   */
  private updateLocationData(position: GeolocationPosition) {
    this.latitude = position.coords.latitude;
    this.longitude = position.coords.longitude;
    this.coordinates = `${this.latitude.toFixed(7)}, ${this.longitude.toFixed(7)}`;
    this.hasLocationPermission = true;
    this.locationPermissionDenied = false;
  }

  capturePhoto(): string {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg');
    }
    return '';
  }

  // Método para convertir base64 a File
  base64ToFile(base64String: string, filename: string): File {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  // Método para extraer mensaje de error del servidor
  private extractErrorMessage(error: any): string {
    if (error?.error?.detail) {
      return error.error.detail;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.message) {
      return error.message;
    }

    return 'Ocurrió un error inesperado. Por favor, intente nuevamente.';
  }

  async marcar() {
    // ✅ VALIDACIÓN CRÍTICA: Verificar permiso de ubicación
    await this.forceRequestLocationPermission();

    if (!this.hasLocationPermission) {
      alert('No se puede marcar sin acceso a la ubicación. Por favor, otorgue el permiso de ubicación.');
      return;
    }

    // ✅ VALIDACIÓN CRÍTICA: Verificar que tenemos coordenadas válidas
    if (!this.latitude || !this.longitude) {
      alert('No se pudo obtener su ubicación. Por favor, espere a que se actualice la ubicación e intente nuevamente.');
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    // CAPTURAR LA FOTO INMEDIATAMENTE
    this.capturedImage = this.capturePhoto();
    console.log('📸 Foto capturada:', this.capturedImage ? 'OK' : 'FALLO');

    // Mostrar el card de estado
    this.showStatusCard = true;
    this.hasError = false;

    // Reset estados
    this.statusSteps = {
      uploadingPhoto: 'pending',
      registeringAttendance: 'pending'
    };

    // Variables para almacenar IDs de respuestas
    let marcacionResponse: any = null;
    let adjuntoId: number = 0;

    // ✅ PASO 1: Subir foto PRIMERO
    try {
      this.statusSteps.uploadingPhoto = 'pending';

      if (!this.capturedImage) {
        throw new Error('No se pudo capturar la imagen');
      }

      const timestamp = new Date().getTime();
      const archivo = this.base64ToFile(
        this.capturedImage,
        `marcacion_${timestamp}.jpg`
      );

      console.log('📸 Archivo a subir:', {
        name: archivo.name,
        size: archivo.size,
        type: archivo.type,
        modulo: 1
      });

      const uploadResponse = await firstValueFrom(
        this.apiService.subirAdjunto(1, archivo)
      );

      console.log('✅ Foto subida exitosamente:', uploadResponse);

      if (uploadResponse && uploadResponse.id) {
        adjuntoId = uploadResponse.id;
        console.log('✅ ID del adjunto obtenido:', adjuntoId);
      } else {
        throw new Error('No se obtuvo el ID del adjunto de la respuesta');
      }

      await this.delay(500);
      this.statusSteps.uploadingPhoto = 'success';

    } catch (error: any) {
      console.error('❌ Error al subir foto:', error);
      this.statusSteps.uploadingPhoto = 'error';
      this.errorMessage = this.extractErrorMessage(error);
      this.hasError = true;
      this.isProcessing = false;
      return; // Detenemos el proceso si falla la subida de foto
    }

    // ✅ PASO 2: Registrar asistencia con el adjuntoId
    try {
      this.statusSteps.registeringAttendance = 'pending';

      const payload = {
        latitud: this.latitude,
        longitud: this.longitude,
        adjuntoId: adjuntoId
      };

      console.log('📤 Payload a enviar (registrarAsistencia):', payload);

      marcacionResponse = await firstValueFrom(
        this.apiService.registrarAsistencia(payload)
      );

      console.log('✅ Respuesta de la API (registrar asistencia):', marcacionResponse);

      await this.delay(500);
      this.statusSteps.registeringAttendance = 'success';

      // ✅ Mensaje de éxito
      this.successMessage = '¡Asistencia registrada correctamente!';
      console.log('🎉 Proceso completado exitosamente');

      // ✅ NUEVO: Logout automático después de 3 segundos
      console.log('⏳ Esperando 3 segundos antes de cerrar sesión...');
      await this.delay(3000);
      
      this.realizarLogout();

    } catch (error: any) {
      console.error('❌ Error al registrar asistencia:', error);
      this.statusSteps.registeringAttendance = 'error';
      this.errorMessage = this.extractErrorMessage(error);
      this.hasError = true;
      this.isProcessing = false;
      return; // Detenemos el proceso si falla el registro de asistencia
    }

    this.isProcessing = false;

    console.log('✔ Proceso completado');
    console.log('📊 Estado final:', {
      subirFoto: this.statusSteps.uploadingPhoto,
      registrarAsistencia: this.statusSteps.registeringAttendance,
      adjuntoId: adjuntoId,
      marcacionId: marcacionResponse?.id
    });
  }

  // ✅ NUEVO MÉTODO: Realizar logout completo
  private realizarLogout() {
    console.log('🚪 Cerrando sesión...');

    // Limpiar localStorage
    localStorage.clear();
    console.log('🗑️ localStorage limpiado');

    // Limpiar sessionStorage
    sessionStorage.clear();
    console.log('🗑️ sessionStorage limpiado');

    // Limpiar cookies
    this.eliminarTodasLasCookies();
    console.log('🗑️ Cookies eliminadas');

    // Detener cámara y ubicación
    this.stopCamera();
    this.stopLocationWatch();

    // Redirigir al login
    console.log('➡️ Redirigiendo a /login...');
    this.router.navigate(['/login']);
  }

  // ✅ NUEVO MÉTODO: Eliminar todas las cookies
  private eliminarTodasLasCookies() {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Eliminar cookie en todos los paths posibles
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    }
  }

  cerrarStatus() {
    this.showStatusCard = false;
    this.capturedImage = null;
    this.errorMessage = '';
    this.successMessage = '';

    // Reiniciar la cámara
    this.initCamera();

    // ✅ REINICIAR LA UBICACIÓN después de marcar
    console.log('🔄 Reiniciando seguimiento de ubicación...');
    this.coordinates = '';
    this.latitude = 0;
    this.longitude = 0;

    // Detener el watch actual y solicitar nuevamente
    this.stopLocationWatch();
    this.forceRequestLocationPermission();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async forceRequestLocationPermission() {
    this.stopLocationWatch(); // Detiene cualquier seguimiento anterior
    this.coordinates = '';
    this.latitude = 0;
    this.longitude = 0;
    this.hasLocationPermission = false;
    this.locationPermissionDenied = false;
  
    try {
      console.log('📍 Solicitando permiso de ubicación nuevamente...');
      await this.requestLocationPermission();
    } catch (err) {
      console.error('❌ No se pudo solicitar la ubicación:', err);
    }
  }
}