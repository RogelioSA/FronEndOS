import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';

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
  fechaInicial: any;
  fechaFinal: any;

  constructor(
    private apiService: ApiService,
    private datePipe: DatePipe
  ){
    // Establecer el primer y último día del mes actual
    this.establecerFechasMesActual();
  }

  establecerFechasMesActual() {
    const hoy = new Date();
    
    // Primer día del mes
    this.fechaInicial = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Último día del mes (día 0 del siguiente mes)
    this.fechaFinal = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    console.log('📅 Fechas establecidas:', {
      inicio: this.fechaInicial,
      fin: this.fechaFinal
    });
  }

  async ngOnInit(): Promise<void> {
    // Cargar marcaciones automáticamente al iniciar
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
          dni: marcacion.personal?.persona?.documentoIdentidad || 'N/A',
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
        empleado.marcaciones[fechaKey].datosEntrada = marcacion;
      } else if (marcacion.tipoEvento === 1) { // Salida
        empleado.marcaciones[fechaKey].salida = hora || '';
        empleado.marcaciones[fechaKey].datosSalida = marcacion;
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

    if (datos.latitud && datos.longitud) {
      setTimeout(() => {
        this.inicializarMapa(datos.latitud, datos.longitud);
      }, 100);
    }
  }

  inicializarMapa(latitud: number, longitud: number) {
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
    
    const mapContainer = document.getElementById('mapaMarcacion');
    if (mapContainer) {
      mapContainer.innerHTML = '';
    }

    const map = L.map('mapaMarcacion').setView([latitud, longitud], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const marker = L.marker([latitud, longitud]).addTo(map);
    marker.bindPopup(`<b>Ubicación de marcación</b><br>Lat: ${latitud}<br>Lng: ${longitud}`).openPopup();

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

  /* ================= EXPORTAR A EXCEL ================= */
  descargarExcel() {
    if (!this.datosReporte || this.datosReporte.length === 0) {
      this.showMessage('No hay datos para exportar');
      return;
    }

    try {
      this.blockUI.start('Generando Excel...');

      // Crear el array de datos para Excel
      const datosExcel: any[] = [];

      // Crear encabezado principal (primera fila con fechas)
      const encabezadoFechas = ['DNI', 'PERSONAL'];
      this.columnasdinamicas.forEach(col => {
      encabezadoFechas.push(`${col.diaSemana} ${col.fechaDisplay}`);
        encabezadoFechas.push(''); // Columna adicional para Salida
      });
      datosExcel.push(encabezadoFechas);

      // Crear subencabezado (segunda fila con E y S)
      const subencabezado = ['', '']; // Vacíos para DNI y PERSONAL
      this.columnasdinamicas.forEach(() => {
        subencabezado.push('E');
        subencabezado.push('S');
      });
      datosExcel.push(subencabezado);

      // Agregar datos de empleados
      this.datosReporte.forEach(empleado => {
        const fila: any[] = [empleado.dni, empleado.personal];
        
        this.columnasdinamicas.forEach(col => {
          const entrada = this.obtenerMarcacion(empleado, col.fecha, 'E');
          const salida = this.obtenerMarcacion(empleado, col.fecha, 'S');
          
          fila.push(entrada || '');
          fila.push(salida || '');
        });
        
        datosExcel.push(fila);
      });

      // Crear libro de trabajo
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(datosExcel);

      // Aplicar estilos y ajustar anchos de columna
      const colWidths = [
        { wch: 12 },  // DNI
        { wch: 35 }   // PERSONAL
      ];
      
      // Ancho para cada par de columnas E/S
      this.columnasdinamicas.forEach(() => {
        colWidths.push({ wch: 8 });  // E
        colWidths.push({ wch: 8 });  // S
      });
      
      ws['!cols'] = colWidths;

      // Mergear celdas del encabezado de fechas
      const merges: XLSX.Range[] = [];
      let colIndex = 2; // Empezar después de DNI y PERSONAL
      
      this.columnasdinamicas.forEach((col, index) => {
        // Mergear las columnas E y S bajo cada fecha
        merges.push({
          s: { r: 0, c: colIndex },
          e: { r: 0, c: colIndex + 1 }
        });
        colIndex += 2;
      });
      
      ws['!merges'] = merges;

      // Crear el libro
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Marcaciones');

      // Generar nombre de archivo con fecha
      const fechaActual = this.datePipe.transform(new Date(), 'dd-MM-yyyy');
      const nombreArchivo = `Reporte_Marcaciones_${fechaActual}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(wb, nombreArchivo);

      this.showMessage('Excel descargado correctamente');
      
    } catch (error) {
      console.error('❌ Error al generar Excel:', error);
      this.showMessage('Error al generar el archivo Excel');
    } finally {
      this.blockUI.stop();
    }
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