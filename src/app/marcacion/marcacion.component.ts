import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { AnalogClockComponent } from '../analog-clock/analog-clock.component';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { AuthService } from '../services/auth.service';

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
  
  // Variables para el estado
  showStatusCard: boolean = false;
  isProcessing: boolean = false;
  hasError: boolean = false;
  
  statusSteps = {
    creatingMarcacion: 'pending',
    creatingDirectory: 'pending',
    registeringPhoto: 'pending'
  };

  constructor(private authService: AuthService){
    
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
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.coordinates = `${lat.toFixed(7)}, ${lng.toFixed(7)}`;
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

  async marcar() {
    this.isProcessing = true;
    this.capturedImage = this.capturePhoto();
    
    // Mostrar el card de estado
    this.showStatusCard = true;
    this.hasError = false;
    
    // Reset estados
    this.statusSteps = {
      creatingMarcacion: 'pending',
      creatingDirectory: 'pending',
      registeringPhoto: 'pending'
    };

    try {
      // Simular proceso de marcación (reemplaza con tu lógica real)
      // Paso 1: Crear marcación
      await this.delay(1000);
      this.statusSteps.creatingMarcacion = 'success';
      
      // Paso 2: Crear directorio
      await this.delay(1000);
      this.statusSteps.creatingDirectory = 'success';
      
      // Paso 3: Registrar foto
      await this.delay(1000);
      this.statusSteps.registeringPhoto = 'success';

      // Aquí deberías hacer la llamada real a tu API
      // const response = await this.marcacionService.registrarMarcacion({
      //   imagen: this.capturedImage,
      //   coordenadas: this.coordinates,
      //   empleado: this.claims
      // });

    } catch (error) {
      console.error('Error al marcar:', error);
      this.statusSteps.creatingMarcacion = 'error';
      this.hasError = true;
    } finally {
      this.isProcessing = false;
    }
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