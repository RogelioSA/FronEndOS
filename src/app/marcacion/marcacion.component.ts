import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { AnalogClockComponent } from '../analog-clock/analog-clock.component';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';

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
  
  // Variables para el estado
  showStatusCard: boolean = false;
  isProcessing: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  
  statusSteps = {
    creatingMarcacion: 'pending',
    creatingDirectory: 'pending',
    registeringPhoto: 'pending'
  };

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ){
    
  }

  ngOnInit(){
    this.claims = this.authService.getClaims();
    this.fecha = this.hoy.toLocaleDateString('en-GB');
    this.initCamera();
    this.getLocation();
  }

  ngOnDestroy() {
    this.stopCamera();
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

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.coordinates = `${this.latitude.toFixed(7)}, ${this.longitude.toFixed(7)}`;
          console.log('📍 Ubicación obtenida:', this.coordinates);
        },
        (error) => {
          console.error('Error al obtener ubicación:', error);
          this.coordinates = 'No disponible';
        }
      );
    }
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
    // Validaciones previas
    if (!this.latitude || !this.longitude) {
      alert('No se pudo obtener su ubicación. Por favor, recargue la página y otorgue los permisos.');
      return;
    }
  
    // Obtener empresaId del localStorage
    const empresaSeleccionada = localStorage.getItem('empresa_id');
    console.log('🔍 DEBUG - empresaSeleccionada (raw):', empresaSeleccionada);
  
    if (!empresaSeleccionada) {
      console.error('❌ No existe "empresaSeleccionada" en localStorage');
      alert('No se encontró la empresa seleccionada');
      return;
    }
  
    const empresaId = parseInt(empresaSeleccionada, 10);
    console.log('🔍 DEBUG - empresaId extraído:', empresaId);
  
    if (!empresaId || isNaN(empresaId)) {
      console.error('❌ empresaId no es un número válido');
      alert('No se pudo obtener el ID de la empresa');
      return;
    }
  
    this.isProcessing = true;
    this.errorMessage = '';
    
    // CAPTURAR LA FOTO INMEDIATAMENTE
    this.capturedImage = this.capturePhoto();
    console.log('📸 Foto capturada:', this.capturedImage ? 'OK' : 'FALLO');
    
    // Mostrar el card de estado
    this.showStatusCard = true;
    this.hasError = false; 
    
    // Reset estados
    this.statusSteps = {
      creatingMarcacion: 'pending',
      creatingDirectory: 'pending',
      registeringPhoto: 'pending'
    };
  
    // Variables para almacenar IDs de respuestas
    let marcacionResponse: any = null;
    let adjuntoId: number = 0;
  
    // ✅ EJECUTAR EN PARALELO: Registrar Asistencia + Subir Foto
    const resultados = await Promise.allSettled([
      // Paso 1: Registrar asistencia
      (async () => {
        try {
          this.statusSteps.creatingMarcacion = 'pending';
          
          const payload = {
            latitud: this.latitude,
            longitud: this.longitude,
          };
    
          console.log('📤 Payload a enviar (registrarAsistencia):', payload);
    
          marcacionResponse = await firstValueFrom(
            this.apiService.registrarAsistencia(payload)
          );
    
          console.log('✅ Respuesta de la API (registrar asistencia):', marcacionResponse);
          
          await this.delay(500);
          this.statusSteps.creatingMarcacion = 'success';
          
          return { success: true, data: marcacionResponse };
        } catch (error: any) {
          console.error('❌ Error al crear marcación:', error);
          this.statusSteps.creatingMarcacion = 'error';
          this.errorMessage = this.extractErrorMessage(error);
          throw error;
        }
      })(),
      
      // Paso 2: Subir foto (EN PARALELO)
      (async () => {
        try {
          this.statusSteps.creatingDirectory = 'pending';
          
          if (this.capturedImage) {
            const timestamp = new Date().getTime();
            const archivo = this.base64ToFile(
              this.capturedImage, 
              `marcacion_${empresaId}_${timestamp}.jpg`
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
              console.log('✅ ID del adjunto:', adjuntoId);
            }
            
            await this.delay(500);
            this.statusSteps.creatingDirectory = 'success';
            
            return { success: true, adjuntoId: adjuntoId };
          } else {
            throw new Error('No se pudo capturar la imagen');
          }
        } catch (error: any) {
          console.error('❌ Error al subir foto:', error);
          this.statusSteps.creatingDirectory = 'error';
          if (!this.errorMessage) {
            this.errorMessage = this.extractErrorMessage(error);
          }
          throw error;
        }
      })()
    ]);

    // Verificar resultados de las promesas paralelas
    const resultadoMarcacion = resultados[0];
    const resultadoFoto = resultados[1];

    console.log('📊 Resultados paralelos:', {
      marcacion: resultadoMarcacion.status,
      foto: resultadoFoto.status
    });

    // Si falla la marcación, detenemos todo
    if (resultadoMarcacion.status === 'rejected') {
      this.hasError = true;
      this.isProcessing = false;
      return;
    }

    // Extraer adjuntoId si la foto se subió correctamente
    if (resultadoFoto.status === 'fulfilled') {
      adjuntoId = (resultadoFoto.value as any).adjuntoId;
    }
  
    // ✅ PASO 3: CREAR PersonaAdjuntosUseCase (solo si hay adjuntoId)
    try {
      this.statusSteps.registeringPhoto = 'pending';
      
      if (adjuntoId > 0) {
        const personaAdjuntosPayload = {
          persona: {
            empresaId: empresaId,
            nombres: this.claims.cNombres || "string",
            apellidoPaterno: this.claims.cApPater || "string",
            apellidoMaterno: this.claims.cApMater || "string",
            fechaNacimiento: new Date().toISOString(),
            documentoIdentidad: "string",
            correo: "string",
            celular: "string",
            estado: true,
            sexoId: 0,
            distritoId: 0,
            licenciaConducirId: 0,
            documentoIdentidadTipoId: 0
          },
          personaAdjuntos: [
            {
              id: 0,
              empresaId: empresaId,
              personaId: 0,
              adjuntoId: adjuntoId,
              adjuntoTipoId: 1,
              esFotoPrincipal: true
            }
          ]
        };
  
        console.log('📤 Payload PersonaAdjuntosUseCase:', personaAdjuntosPayload);
  
        const personaAdjuntosResponse = await firstValueFrom(
          this.apiService.crearPersonaAdjuntosUseCase(personaAdjuntosPayload)
        );
  
        console.log('✅ PersonaAdjuntosUseCase creado exitosamente:', personaAdjuntosResponse);
        
        await this.delay(500);
        this.statusSteps.registeringPhoto = 'success';
        
      } else {
        console.error('❌ No se pudo obtener el ID del adjunto para PersonaAdjuntosUseCase');
        this.statusSteps.registeringPhoto = 'error';
        if (!this.errorMessage) {
          this.errorMessage = 'No se pudo obtener el ID del adjunto';
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error al crear PersonaAdjuntosUseCase:', error);
      this.statusSteps.registeringPhoto = 'error';
      if (!this.errorMessage) {
        this.errorMessage = this.extractErrorMessage(error);
      }
    }
  
    // Determinar si hubo algún error
    this.hasError = 
      this.statusSteps.creatingMarcacion === 'error' ||
      this.statusSteps.creatingDirectory === 'error' ||
      this.statusSteps.registeringPhoto === 'error';
  
    this.isProcessing = false;
    
    console.log('🏁 Proceso completado');
    console.log('📊 Estado final:', {
      marcacion: this.statusSteps.creatingMarcacion,
      subirFoto: this.statusSteps.creatingDirectory,
      personaAdjuntos: this.statusSteps.registeringPhoto,
      adjuntoId: adjuntoId
    });
  }

  cerrarStatus() {
    this.showStatusCard = false;
    this.capturedImage = null;
    this.errorMessage = '';
    this.initCamera();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}