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
    // Separar el data URL
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

  async marcar() {
    // Validaciones previas
    if (!this.latitude || !this.longitude) {
      alert('No se pudo obtener su ubicación. Por favor, recargue la página y otorgue los permisos.');
      return;
    }
  
    // Obtener empresaId del localStorage
    const empresaSeleccionada = localStorage.getItem('empresaSeleccionada');
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
  
    try {
      // Paso 1: Crear marcación
      this.statusSteps.creatingMarcacion = 'pending';
      
      const fechaActual = new Date();
      const payload = {
        empresaId: empresaId,
        personalId: 1,
        fecha: fechaActual.toISOString(),
        fechaJornal: fechaActual.toISOString().split('T')[0],
        tipoEvento: 1,
        esTardanza: true,
        diferenciaMinutos: 1,
        latitud: this.latitude,
        longitud: this.longitude,
        horarioDetalleEventoId: 1,
        registroAsistenciaPoliticaId: 1
      };
  
      console.log('📤 Payload a enviar (registrarAsistencia):', payload);
  
      marcacionResponse = await firstValueFrom(
        this.apiService.registrarAsistencia(payload)
      );
  
      console.log('✅ Respuesta de la API (registrar asistencia):', marcacionResponse);
      
      await this.delay(500);
      this.statusSteps.creatingMarcacion = 'success';
      
    } catch (error: any) {
      console.error('❌ Error al crear marcación:', error);
      this.statusSteps.creatingMarcacion = 'error';
    }
  
    try {
      // Paso 2: Subir foto (SIEMPRE SE EJECUTA)
      this.statusSteps.creatingDirectory = 'pending';
      
      if (this.capturedImage) {
        // Convertir la imagen base64 a File
        const timestamp = new Date().getTime();
        const archivo = this.base64ToFile(
          this.capturedImage, 
          `marcacion_${empresaId}_${timestamp}.jpg`
        );
        
        console.log('📸 DEBUG Archivo a subir:', {
          name: archivo.name,
          size: archivo.size,
          type: archivo.type,
          modulo: 1
        });
        
        // Subir el adjunto con módulo 1
        const uploadResponse = await firstValueFrom(
          this.apiService.subirAdjunto(1, archivo)
        );
        
        console.log('✅ Respuesta de la API (subir adjunto):', uploadResponse);
        
        // Guardar el ID del adjunto
        if (uploadResponse && uploadResponse.id) {
          adjuntoId = uploadResponse.id;
          console.log('✅ ID del adjunto guardado:', adjuntoId);
        }
        
        await this.delay(500);
        this.statusSteps.creatingDirectory = 'success';
        
      } else {
        console.error('❌ No se pudo capturar la imagen');
        this.statusSteps.creatingDirectory = 'error';
      }
      
    } catch (error: any) {
      console.error('❌ Error al subir foto:', error);
      console.error('❌ Error completo:', error.error);
      this.statusSteps.creatingDirectory = 'error';
    }
  
    try {
      // Paso 3: Crear PersonaAdjuntosUseCase
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
  
        console.log('✅ Respuesta PersonaAdjuntosUseCase:', personaAdjuntosResponse);
        
        await this.delay(500);
        this.statusSteps.registeringPhoto = 'success';
        
      } else {
        console.error('❌ No se pudo obtener el ID del adjunto');
        this.statusSteps.registeringPhoto = 'error';
      }
      
    } catch (error: any) {
      console.error('❌ Error al crear PersonaAdjuntosUseCase:', error);
      console.error('❌ Error completo:', error.error);
      this.statusSteps.registeringPhoto = 'error';
    }
  
    // Determinar si hubo algún error
    this.hasError = 
      this.statusSteps.creatingMarcacion === 'error' ||
      this.statusSteps.creatingDirectory === 'error' ||
      this.statusSteps.registeringPhoto === 'error';
  
    this.isProcessing = false;
  }

  cerrarStatus() {
    this.showStatusCard = false;
    this.capturedImage = null;
    this.initCamera(); // Reiniciar cámara
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}