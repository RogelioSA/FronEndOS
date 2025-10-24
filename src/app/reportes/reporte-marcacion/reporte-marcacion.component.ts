import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DatePipe } from '@angular/common';

interface MarcacionPorDia {
  entrada?: string;
  salida?: string;
  tardanza?: boolean;
  datosEntrada?: any;
  datosSalida?: any;
}

interface EmpleadoReporte {
  dni: string;
  personal: string;
  personalId: number;
  marcaciones: { [fecha: string]: MarcacionPorDia };
}

interface DetalleMarcacion {
  personal: string;
  dni: string;
  fecha: string;
  fechaJornal: string;
  tipoEvento: string;
  hora: string;
  esTardanza: boolean;
  diferenciaMinutos: number;
  latitud: number | null;
  longitud: number | null;
  politica: string;
  horaProgramada: string;
  linkGoogleMaps: string;
}

@Component({
    selector: 'app-reporte-marcacion',
    templateUrl: './reporte-marcacion.component.html',
    styleUrl: './reporte-marcacion.component.css',
    providers: [DatePipe],
    standalone: false
})
export class ReporteMarcacionComponent {

  marcaciones: any[] = [];
  datosReporte: EmpleadoReporte[] = [];
  columnasdinamicas: any[] = [];
  
  // Propiedades para el modal
  mostrarModal: boolean = false;
  detalleMarcacion: DetalleMarcacion | null = null;
  
  @BlockUI() blockUI!: NgBlockUI;

  now: Date = new Date();
  fechaInicial: any = this.now;
  fechaFinal: any = this.now;

  constructor(
    private apiService: ApiService,
    private datePipe: DatePipe
  ){}

  async ngOnInit(): Promise<void> {
    // Cargar marcaciones al iniciar con la fecha actual
    await this.buscar();
  }

  async traerMarcaciones() {
    this.blockUI.start('Cargando marcaciones...');
  
    try {
      console.log("📅 Trayendo marcaciones desde API...");
      const result = await firstValueFrom(
        this.apiService.getRegistroAsistencia()
      );
  
      console.log("✅ Marcaciones recibidas:", result);

      this.marcaciones = result;
      this.procesarDatosParaReporte();
  
    } catch (error) {
      console.error('❌ Error trayendo las marcaciones:', error);
      this.showMessage('Error al cargar las marcaciones');
    } finally {
      this.blockUI.stop();
    }
  }

  procesarDatosParaReporte() {
    // Filtrar por rango de fechas
    const marcacionesFiltradas = this.marcaciones.filter(m => {
      const fechaJornal = new Date(m.fechaJornal);
      const fechaIni = new Date(this.fechaInicial);
      const fechaFin = new Date(this.fechaFinal);
      
      // Normalizar las fechas (quitar hora)
      fechaJornal.setHours(0, 0, 0, 0);
      fechaIni.setHours(0, 0, 0, 0);
      fechaFin.setHours(0, 0, 0, 0);
      
      return fechaJornal >= fechaIni && fechaJornal <= fechaFin;
    });

    // Generar columnas dinámicas (fechas en el rango)
    this.generarColumnasFechas();

    // Agrupar por empleado
    const empleadosMap = new Map<number, EmpleadoReporte>();

    marcacionesFiltradas.forEach(marcacion => {
      const personalId = marcacion.personalId;
      
      if (!empleadosMap.has(personalId)) {
        empleadosMap.set(personalId, {
          dni: marcacion.personal?.persona?.numeroDocumento || 'N/A',
          personal: this.obtenerNombreCompleto(marcacion.personal),
          personalId: personalId,
          marcaciones: {}
        });
      }

      const empleado = empleadosMap.get(personalId)!;
      const fechaKey = this.datePipe.transform(marcacion.fechaJornal, 'yyyy-MM-dd')!;
      
      if (!empleado.marcaciones[fechaKey]) {
        empleado.marcaciones[fechaKey] = {};
      }

      const hora = this.datePipe.transform(marcacion.fecha, 'HH:mm');
      
      if (marcacion.tipoEvento === 0) { // Entrada
        empleado.marcaciones[fechaKey].entrada = hora || '';
        empleado.marcaciones[fechaKey].tardanza = marcacion.esTardanza;
        empleado.marcaciones[fechaKey].datosEntrada = marcacion; // Guardamos todos los datos
      } else if (marcacion.tipoEvento === 1) { // Salida
        empleado.marcaciones[fechaKey].salida = hora || '';
        empleado.marcaciones[fechaKey].datosSalida = marcacion; // Guardamos todos los datos
      }
    });

    this.datosReporte = Array.from(empleadosMap.values());
    console.log("✅ Datos procesados para reporte:", this.datosReporte);
  }

  generarColumnasFechas() {
    this.columnasdinamicas = [];
    
    const fechaIni = new Date(this.fechaInicial);
    const fechaFin = new Date(this.fechaFinal);
    
    let fechaActual = new Date(fechaIni);
    
    while (fechaActual <= fechaFin) {
      const fechaKey = this.datePipe.transform(fechaActual, 'yyyy-MM-dd')!;
      const fechaDisplay = this.datePipe.transform(fechaActual, 'dd/MM/yyyy')!;
      const diaSemana = this.obtenerDiaSemana(fechaActual);
      
      this.columnasdinamicas.push({
        fecha: fechaKey,
        fechaDisplay: fechaDisplay,
        diaSemana: diaSemana,
        diaSemanaCorto: this.obtenerDiaSemanaCorto(fechaActual)
      });
      
      // Siguiente día
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    console.log("📅 Columnas generadas:", this.columnasdinamicas);
  }

  obtenerDiaSemana(fecha: Date): string {
    const dias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    return dias[fecha.getDay()];
  }

  obtenerDiaSemanaCorto(fecha: Date): string {
    const dias = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    return dias[fecha.getDay()];
  }

  obtenerNombreCompleto(personal: any): string {
    if (!personal || !personal.persona) {
      return "Sin información";
    }
    
    const nombres = personal.persona.nombres || "";
    const apellidoPaterno = personal.persona.apellidoPaterno || "";
    const apellidoMaterno = personal.persona.apellidoMaterno || "";
    
    return `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`.trim() || "Sin nombre";
  }

  obtenerMarcacion(empleado: EmpleadoReporte, fecha: string, tipo: 'E' | 'S'): string {
    const marcacion = empleado.marcaciones[fecha];
    if (!marcacion) return '';
    
    if (tipo === 'E') {
      return marcacion.entrada || '';
    } else {
      return marcacion.salida || '';
    }
  }

  esTardanza(empleado: EmpleadoReporte, fecha: string): boolean {
    const marcacion = empleado.marcaciones[fecha];
    return marcacion?.tardanza || false;
  }

  abrirDetalleMarcacion(empleado: EmpleadoReporte, fecha: string, tipo: 'E' | 'S') {
    const marcacion = empleado.marcaciones[fecha];
    if (!marcacion) return;

    const datos = tipo === 'E' ? marcacion.datosEntrada : marcacion.datosSalida;
    if (!datos) return;

    const tipoEventoTexto = this.obtenerTipoEventoTexto(datos.tipoEvento);
    const hora = this.datePipe.transform(datos.fecha, 'HH:mm:ss') || '';
    const fechaCompleta = this.datePipe.transform(datos.fecha, 'dd/MM/yyyy HH:mm:ss') || '';
    const fechaJornal = this.datePipe.transform(datos.fechaJornal, 'dd/MM/yyyy') || '';

    // Crear enlace a Google Maps si hay coordenadas
    let linkGoogleMaps = '';
    if (datos.latitud && datos.longitud) {
      linkGoogleMaps = `https://www.google.com/maps?q=${datos.latitud},${datos.longitud}`;
    }

    this.detalleMarcacion = {
      personal: empleado.personal,
      dni: empleado.dni,
      fecha: fechaCompleta,
      fechaJornal: fechaJornal,
      tipoEvento: tipoEventoTexto,
      hora: hora,
      esTardanza: datos.esTardanza,
      diferenciaMinutos: datos.diferenciaMinutos,
      latitud: datos.latitud,
      longitud: datos.longitud,
      politica: datos.registroAsistenciaPolitica?.nombreCorto || 'N/A',
      horaProgramada: datos.horarioDetalleEvento?.hora || 'N/A',
      linkGoogleMaps: linkGoogleMaps
    };

    this.mostrarModal = true;

    // Inicializar el mapa después de que el modal se renderice
    if (datos.latitud && datos.longitud) {
      setTimeout(() => {
        this.inicializarMapa(datos.latitud, datos.longitud);
      }, 100);
    }
  }

  inicializarMapa(latitud: number, longitud: number) {
    // Cargar Leaflet dinámicamente si no está cargado
    if (typeof (window as any).L === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        this.crearMapa(latitud, longitud);
      };
      document.head.appendChild(script);
    } else {
      this.crearMapa(latitud, longitud);
    }
  }

  crearMapa(latitud: number, longitud: number) {
    const L = (window as any).L;
    
    // Limpiar mapa anterior si existe
    const mapContainer = document.getElementById('mapaMarcacion');
    if (mapContainer) {
      mapContainer.innerHTML = '';
    }

    // Crear el mapa
    const map = L.map('mapaMarcacion').setView([latitud, longitud], 16);

    // Agregar capa de tiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Agregar marcador en la ubicación
    const marker = L.marker([latitud, longitud]).addTo(map);
    marker.bindPopup(`<b>Ubicación de marcación</b><br>Lat: ${latitud}<br>Lng: ${longitud}`).openPopup();

    // Forzar que el mapa recalcule su tamaño
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.detalleMarcacion = null;
  }

  obtenerTipoEventoTexto(tipoEvento: number): string {
    switch(tipoEvento) {
      case 0: return "Entrada";
      case 1: return "Salida";
      case 2: return "Inicio Refrigerio";
      case 3: return "Fin Refrigerio";
      default: return `Tipo ${tipoEvento}`;
    }
  }

  async buscar() {
    // Validar fechas
    if (!this.fechaInicial || !this.fechaFinal) {
      this.showMessage('Selecciona ambas fechas');
      return;
    }

    if (this.fechaInicial > this.fechaFinal) {
      this.showMessage('La fecha inicial no puede ser mayor que la fecha final');
      return;
    }

    await this.traerMarcaciones();
  }

  showMessage(message: string) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
      messageBox.innerText = message;
      messageBox.style.display = 'block';
      setTimeout(() => {
        messageBox.style.display = 'none';
      }, 3000);
    }
  }
}