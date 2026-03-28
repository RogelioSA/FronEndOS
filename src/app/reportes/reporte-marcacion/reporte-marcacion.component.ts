import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DatePipe } from '@angular/common';
import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

interface MarcacionPorDia {
  entrada?: string;
  salida?: string;
  salidaRefrigerio?: string;
  entradaRefrigerio?: string;
  desconocido?: string;
  tardanza?: boolean;
  datosEntrada?: any;
  datosSalida?: any;
  datosSalidaRefrigerio?: any;
  datosEntradaRefrigerio?: any;
  datosDesconocido?: any;
}

interface EmpleadoReporte {
  orden: string;
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
  tipoEventoCodigo: number;
  hora: string;
  esTardanza: boolean;
  diferenciaMinutos: number;
  latitud: number | null;
  longitud: number | null;
  politica: string;
  horaProgramada: string;
  ordenTrabajoId: number | null;
  linkGoogleMaps: string;
  personalId: number;
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
  datosAgrupados: { orden: string; empleados: EmpleadoReporte[] }[] = [];
  columnasdinamicas: any[] = [];
  ordenesTrabajo: { id: number; cOrdenInterna: string; adjuntoId?: number }[] = [];
  ordenTrabajoSeleccionada: number | null = null;
  eventosMarcacion = [
    { id: 0, nombre: 'Entrada' },
    { id: 1, nombre: 'Salida' },
    { id: 2, nombre: 'Salida Refrigerio' },
    { id: 3, nombre: 'Entrada Refrigerio' },
    { id: 99, nombre: 'Desconocido' }
  ];

  // Propiedades para el modal
  mostrarModal: boolean = false;
  detalleMarcacion: DetalleMarcacion | null = null;
  editandoMarcacion: boolean = false;
  mostrarRegularizacionNueva: boolean = false;
  contextoRegularizacionNueva: { empleado: EmpleadoReporte; fecha: string; tipoEvento: number } | null = null;
  regularizacion = {
    jornal: '',
    evento: 0,
    ordenTrabajoId: null as number | null,
    hora: '',
  };

  // Nueva propiedad para el checkbox
  verTodo: boolean = false;

  rostroUrl: string | null = null;

  @BlockUI() blockUI!: NgBlockUI;

  now: Date = new Date();
  fechaInicial: any;
  fechaFinal: any;

  constructor(
    private apiService: ApiService,
    private datePipe: DatePipe
  ){
    this.establecerFechasMesActual();
  }

  establecerFechasMesActual() {
    const hoy = new Date();
    this.fechaInicial = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaFinal = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    this.fechaFinal.setHours(23, 59, 59, 999);
    console.log('📅 Fechas establecidas:', {
      inicio: this.fechaInicial,
      fin: this.fechaFinal
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarOrdenesTrabajo();
    await this.buscar();
  }

  async cargarOrdenesTrabajo() {
    try {
      const response = await firstValueFrom(
        this.apiService.listarOrdenTrabajoCabeceraSimplificado()
      );

      this.ordenesTrabajo = response.map((ot: any) => ({
        id: ot.id,
        cOrdenInterna: `${ot.nombre} - ${ot.descripcion}`,
        adjuntoId: ot.adjuntoId
      }));
    } catch (error) {
      console.error('❌ Error al cargar órdenes de trabajo:', error);
      this.showMessage('Error al cargar las órdenes de trabajo');
    }
  }

  async traerMarcaciones() {
    this.blockUI.start('Cargando marcaciones...');

    try {
      const fechaInicio = this.datePipe.transform(this.fechaInicial, 'yyyy-MM-dd');
      const fechaFin = this.datePipe.transform(this.fechaFinal, 'yyyy-MM-dd') + 'T23:59:59';

      if (!fechaInicio || !fechaFin) {
        throw new Error('Fechas inválidas');
      }

      const result = await firstValueFrom(
        this.apiService.getRegistroAsistencia(fechaInicio, fechaFin)
      );

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
    const fechaIni = new Date(this.fechaInicial);
    const fechaFin = new Date(this.fechaFinal);

    const marcacionesFiltradas = this.marcaciones.filter(m => {
      const fechaJornal = new Date(m.fecha);
      const cumpleFecha = fechaJornal >= fechaIni && fechaJornal <= fechaFin;
      const cumpleOrdenTrabajo = !this.ordenTrabajoSeleccionada ||
      m.ordenTrabajo?.id === this.ordenTrabajoSeleccionada;
      return cumpleFecha && cumpleOrdenTrabajo;
    });

    this.generarColumnasFechas();

    const empleadosMap = new Map<string, EmpleadoReporte>();

    marcacionesFiltradas.forEach(marcacion => {
      const personalId = marcacion.personalId;
      const fechaKey = this.datePipe.transform(marcacion.fechaJornal, 'yyyy-MM-dd')!;
      const ordenServicioId = marcacion.ordenServicio?.id ?? 'sinOS';
      const ordenTrabajoId = marcacion.ordenTrabajo?.id ?? 'sinOT';

      const grupoKey = `${personalId}-${ordenServicioId}-${ordenTrabajoId}`;

      if (!empleadosMap.has(grupoKey)) {
        empleadosMap.set(grupoKey, {
          orden: this.obtenerOrdenInfo(marcacion),
          dni: marcacion.persona?.documentoIdentidad || marcacion.personal?.persona?.documentoIdentidad || 'N/A',
          personal: this.obtenerNombreCompleto(marcacion.personal, marcacion.persona),
          personalId: personalId,
          marcaciones: {}
        });
      }

      const empleado = empleadosMap.get(grupoKey)!;
      if (empleado.orden === 'Sin orden vinculada') {
        empleado.orden = this.obtenerOrdenInfo(marcacion);
      }

      if (!empleado.marcaciones[fechaKey]) {
        empleado.marcaciones[fechaKey] = {};
      }

      const hora = this.datePipe.transform(marcacion.fecha, 'HH:mm');
      const tipoEvento = marcacion.tipoEvento ?? 99;

      switch(tipoEvento) {
        case 0:
          empleado.marcaciones[fechaKey].entrada = hora || '';
          empleado.marcaciones[fechaKey].tardanza = marcacion.esTardanza;
          empleado.marcaciones[fechaKey].datosEntrada = marcacion;
          break;
        case 1:
          empleado.marcaciones[fechaKey].salida = hora || '';
          empleado.marcaciones[fechaKey].datosSalida = marcacion;
          break;
        case 2:
          empleado.marcaciones[fechaKey].salidaRefrigerio = hora || '';
          empleado.marcaciones[fechaKey].datosSalidaRefrigerio = marcacion;
          break;
        case 3:
          empleado.marcaciones[fechaKey].entradaRefrigerio = hora || '';
          empleado.marcaciones[fechaKey].datosEntradaRefrigerio = marcacion;
          break;
        default:
          empleado.marcaciones[fechaKey].desconocido = hora || '';
          empleado.marcaciones[fechaKey].datosDesconocido = marcacion;
          break;
      }
    });

    this.datosReporte = Array.from(empleadosMap.values());
    this.agruparDatosPorOrden();
    console.log("✅ Datos procesados para reporte:", this.datosReporte);
  }

  agruparDatosPorOrden() {
    const grupos = new Map<string, EmpleadoReporte[]>();

    this.datosReporte.forEach((empleado) => {
      if (!grupos.has(empleado.orden)) {
        grupos.set(empleado.orden, []);
      }
      grupos.get(empleado.orden)!.push(empleado);
    });

    this.datosAgrupados = Array.from(grupos.entries()).map(([orden, empleados]) => ({
      orden,
      empleados,
    }));
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

  obtenerNombreCompleto(personal: any, persona?: any): string {
    const personaInfo = persona || personal?.persona;
    if (!personaInfo) {
      return "Sin información";
    }

    const nombres = personaInfo.nombres || "";
    const apellidoPaterno = personaInfo.apellidoPaterno || "";
    const apellidoMaterno = personaInfo.apellidoMaterno || "";

    const nombreCompleto = personaInfo.nombreCompleto || '';

    if (nombreCompleto) {
      return nombreCompleto;
    }

    return `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`.trim() || "Sin nombre";
  }

  obtenerOrdenInfo(marcacion: any): string {
    const codigoOrdenServicio = marcacion.ordenServicio?.codigoOrdenInterna || marcacion.ordenServicio?.codigoReferencial;
    const nombreOT = marcacion.ordenTrabajo?.nombre;
    const descripcionOT = marcacion.ordenTrabajo?.descripcion;
    const nombreOrdenTrabajo = `${nombreOT} - ${descripcionOT}`;

    const partes = [];
    if (codigoOrdenServicio) {
      partes.push(codigoOrdenServicio);
    }
    if (nombreOrdenTrabajo) {
      partes.push(nombreOrdenTrabajo);
    }

    return partes.join(' - ') || 'Sin orden vinculada';
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

  obtenerMarcacionPorTipo(empleado: EmpleadoReporte, fecha: string, tipoEvento: number): string {
    const marcacion = empleado.marcaciones[fecha];
    if (!marcacion) return '';

    switch(tipoEvento) {
      case 0: return marcacion.entrada || '';
      case 1: return marcacion.salida || '';
      case 2: return marcacion.salidaRefrigerio || '';
      case 3: return marcacion.entradaRefrigerio || '';
      case 99: return marcacion.desconocido || '';
      default: return '';
    }
  }

  tieneMarcacionPorTipo(empleado: EmpleadoReporte, fecha: string, tipoEvento: number): boolean {
    const marcacion = empleado.marcaciones[fecha];
    if (!marcacion) return false;

    switch (tipoEvento) {
      case 0: return !!(marcacion.entrada || marcacion.datosEntrada);
      case 1: return !!(marcacion.salida || marcacion.datosSalida);
      case 2: return !!(marcacion.salidaRefrigerio || marcacion.datosSalidaRefrigerio);
      case 3: return !!(marcacion.entradaRefrigerio || marcacion.datosEntradaRefrigerio);
      case 99: return !!(marcacion.desconocido || marcacion.datosDesconocido);
      default: return false;
    }
  }

  esTardanza(empleado: EmpleadoReporte, fecha: string, tipoEvento: number): boolean {
    const marcacion = empleado.marcaciones[fecha];
    if (tipoEvento !== 0) return false;
    return marcacion?.tardanza || false;
  }

  abrirDetalleMarcacion(empleado: EmpleadoReporte, fecha: string, tipo: 'E' | 'S') {
    const tipoEvento = tipo === 'E' ? 0 : 1;
    this.abrirDetalleMarcacionTipo(empleado, fecha, tipoEvento);
  }

  abrirDetalleMarcacionTipo(empleado: EmpleadoReporte, fecha: string, tipoEvento: number) {
    const marcacion = empleado.marcaciones[fecha];
    if (!marcacion) return;

    let datos: any;
    switch(tipoEvento) {
      case 0: datos = marcacion.datosEntrada; break;
      case 1: datos = marcacion.datosSalida; break;
      case 2: datos = marcacion.datosSalidaRefrigerio; break;
      case 3: datos = marcacion.datosEntradaRefrigerio; break;
      case 99: datos = marcacion.datosDesconocido; break;
      default: return;
    }

    if (!datos) return;

    const tipoEventoTexto = this.obtenerTipoEventoTexto(datos.tipoEvento ?? 99);
    const tipoEventoCodigo = datos.tipoEvento ?? 99;
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
      tipoEventoCodigo: tipoEventoCodigo,
      hora: hora,
      esTardanza: datos.esTardanza,
      diferenciaMinutos: datos.diferenciaMinutos,
      latitud: datos.latitud,
      longitud: datos.longitud,
      politica: datos.registroAsistenciaPolitica?.nombreCorto || datos.registroAsistenciaPolitica?.nombre || 'N/A',
      horaProgramada: datos.horarioDetalleEvento?.hora || 'N/A',
      ordenTrabajoId: datos.ordenTrabajo?.id ?? null,
      linkGoogleMaps: linkGoogleMaps,
      personalId: empleado.personalId
    };

    this.cargarImagenRostro(datos.adjuntoId);
    this.editandoMarcacion = false;
    this.prepararDatosRegularizacion();
    this.mostrarModal = true;

    if (datos.latitud && datos.longitud) {
      setTimeout(() => {
        this.inicializarMapa(datos.latitud, datos.longitud);
      }, 100);
    }
  }

  prepararDatosRegularizacion() {
    if (!this.detalleMarcacion) {
      return;
    }

    this.regularizacion = {
      jornal: this.convertirFechaJornalAISO(this.detalleMarcacion.fechaJornal),
      evento: this.detalleMarcacion.tipoEventoCodigo,
      ordenTrabajoId: this.detalleMarcacion.ordenTrabajoId,
      hora: (this.detalleMarcacion.hora || '').slice(0, 5)
    };
  }

  iniciarRegularizacion() {
    this.editandoMarcacion = true;
    this.prepararDatosRegularizacion();
  }

  cancelarRegularizacion() {
    if (this.mostrarRegularizacionNueva) {
      this.cerrarRegularizacionNueva();
      return;
    }

    this.editandoMarcacion = false;
    this.prepararDatosRegularizacion();
  }

  onCellClick(empleado: EmpleadoReporte, fecha: string, tipoEvento: number) {
    const tieneMarcacion = this.tieneMarcacionPorTipo(empleado, fecha, tipoEvento);

    if (tieneMarcacion) {
      this.abrirDetalleMarcacionTipo(empleado, fecha, tipoEvento);
      return;
    }

    this.abrirRegularizacionNueva(empleado, fecha, tipoEvento);
  }

  abrirRegularizacionNueva(empleado: EmpleadoReporte, fecha: string, tipoEvento: number) {
    this.contextoRegularizacionNueva = { empleado, fecha, tipoEvento };

    const fechaDisplay = this.datePipe.transform(new Date(fecha), 'dd/MM/yyyy') || '';

    this.detalleMarcacion = {
      personal: empleado.personal,
      dni: empleado.dni,
      fecha: fechaDisplay,
      fechaJornal: fechaDisplay,
      tipoEvento: this.obtenerTipoEventoTexto(tipoEvento),
      tipoEventoCodigo: tipoEvento,
      hora: '',
      esTardanza: false,
      diferenciaMinutos: 0,
      latitud: null,
      longitud: null,
      politica: '',
      horaProgramada: '',
      ordenTrabajoId: null,
      linkGoogleMaps: '',
      personalId: empleado.personalId
    };

    this.regularizacion = {
      jornal: fecha,
      evento: tipoEvento,
      ordenTrabajoId: null,
      hora: ''
    };

    this.mostrarRegularizacionNueva = true;
  }

  cerrarRegularizacionNueva() {
    this.mostrarRegularizacionNueva = false;
    this.contextoRegularizacionNueva = null;
    this.editandoMarcacion = false;
    this.detalleMarcacion = null;
    this.regularizacion = {
      jornal: '',
      evento: 0,
      ordenTrabajoId: null,
      hora: ''
    };
  }

  async regularizarMarcacion() {
    const personalId = this.detalleMarcacion?.personalId || this.contextoRegularizacionNueva?.empleado.personalId;
    if (!personalId) {
      this.showMessage('No se pudo identificar al colaborador para regularizar');
      return;
    }

    if (!this.regularizacion.jornal || !this.regularizacion.hora) {
      this.showMessage('Ingresa la fecha y hora de la regularización');
      return;
    }

    const fechaLocal = this.construirFechaHoraLocal(
      this.regularizacion.jornal,
      this.regularizacion.hora
    );
    if (!fechaLocal) {
      this.showMessage('La fecha u hora ingresada no es válida');
      return;
    }

    const payload = {
      empresaId: Number(localStorage.getItem('empresa_id')) || 0,
      personalId,
      fecha: fechaLocal,
      latitud: 0,
      longitud: 0,
      adjuntoId: 0,
      ordenTrabajoId: this.regularizacion.ordenTrabajoId,
      tipoEvento: this.regularizacion.evento
    };

    try {
      this.blockUI.start('Registrando regularización...');
      await firstValueFrom(this.apiService.regularizarMarcacion(payload));
      this.showMessage('Regularización registrada correctamente');
      if (this.mostrarRegularizacionNueva) {
        this.cerrarRegularizacionNueva();
      } else {
        this.editandoMarcacion = false;
        this.detalleMarcacion = null;
        this.mostrarModal = false;
      }
      await this.traerMarcaciones();
    } catch (error) {
      console.error('❌ Error al regularizar la marcación:', error);
      this.showMessage('Error al regularizar la marcación');
    } finally {
      this.blockUI.stop();
    }
  }

  async cargarImagenRostro(adjuntoId: number) {
    this.rostroUrl = null;

    try {
      const imagenUrl = await firstValueFrom(this.apiService.obtenerAdjuntoImagen(adjuntoId));
      this.rostroUrl = imagenUrl;
    } catch (error) {
      console.error('❌ Error al cargar la imagen de rostro:', error);
    }
  }

  private convertirFechaJornalAISO(fechaJornal: string): string {
    const [dia, mes, anio] = fechaJornal.split('/');
    if (!dia || !mes || !anio) {
      return '';
    }

    const diaNormalizado = dia.padStart(2, '0');
    const mesNormalizado = mes.padStart(2, '0');
    return `${anio}-${mesNormalizado}-${diaNormalizado}`;
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
    this.editandoMarcacion = false;
    this.rostroUrl = null;
  }

  obtenerTipoEventoTexto(tipoEvento: number): string {
    switch(tipoEvento) {
      case 0: return "Entrada";
      case 1: return "Salida";
      case 2: return "Salida Refrigerio";
      case 3: return "Entrada Refrigerio";
      case 99: return "Desconocido";
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

  onVerTodoChanged() {
    console.log('👁️ Ver todo:', this.verTodo);
  }

  calcularColspan(): number {
    const baseColumns = 2;
    const eventColumns = this.verTodo ? 5 : 2;
    return baseColumns + (this.columnasdinamicas.length * eventColumns);
  }

  /* ================= EXPORTAR A EXCEL (XLSX básico) ================= */
  descargarExcel() {
    if (!this.datosReporte || this.datosReporte.length === 0) {
      this.showMessage('No hay datos para exportar');
      return;
    }

    try {
      this.blockUI.start('Generando Excel...');

      const datosExcel: any[] = [];

      const encabezadoFechas = ['ORDEN', 'DNI', 'PERSONAL'];
      this.columnasdinamicas.forEach(col => {
        encabezadoFechas.push(`${col.diaSemana} ${col.fechaDisplay}`);
        if (this.verTodo) {
          encabezadoFechas.push('', '', '', '');
        } else {
          encabezadoFechas.push('');
        }
      });
      datosExcel.push(encabezadoFechas);

      const subencabezado = ['', '', ''];
      this.columnasdinamicas.forEach(() => {
        if (this.verTodo) {
          subencabezado.push('E', 'SR', 'ER', 'S', 'D');
        } else {
          subencabezado.push('E', 'S');
        }
      });
      datosExcel.push(subencabezado);

      this.datosReporte.forEach(empleado => {
        const fila: any[] = [empleado.orden, empleado.dni, empleado.personal];

        this.columnasdinamicas.forEach(col => {
          if (this.verTodo) {
            fila.push(
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 0) || '',
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 2) || '',
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 3) || '',
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 1) || '',
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 99) || ''
            );
          } else {
            fila.push(
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 0) || '',
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 1) || ''
            );
          }
        });

        datosExcel.push(fila);
      });

      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(datosExcel);

      const colWidths = [
        { wch: 25 },
        { wch: 12 },
        { wch: 35 }
      ];

      this.columnasdinamicas.forEach(() => {
        if (this.verTodo) {
          colWidths.push({ wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 });
        } else {
          colWidths.push({ wch: 8 }, { wch: 8 });
        }
      });

      ws['!cols'] = colWidths;

      const merges: XLSX.Range[] = [];
      let colIndex = 3;

      this.columnasdinamicas.forEach(() => {
        if (this.verTodo) {
          merges.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + 4 } });
          colIndex += 5;
        } else {
          merges.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + 1 } });
          colIndex += 2;
        }
      });

      ws['!merges'] = merges;

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Marcaciones');

      const fechaActual = this.datePipe.transform(new Date(), 'dd-MM-yyyy');
      const modoVista = this.verTodo ? 'Completo' : 'Resumido';
      const nombreArchivo = `Reporte_Marcaciones_${modoVista}_${fechaActual}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      this.showMessage('Excel descargado correctamente');

    } catch (error) {
      console.error('❌ Error al generar Excel:', error);
      this.showMessage('Error al generar el archivo Excel');
    } finally {
      this.blockUI.stop();
    }
  }

  /* ================= DESCARGAR REPORTE FORMATO TAREO (ExcelJS con estilos) ================= */
  async descargarReporteTareo() {
    if (!this.datosReporte || this.datosReporte.length === 0) {
      this.showMessage('No hay datos para exportar');
      return;
    }

    try {
      this.blockUI.start('Generando reporte tareo...');

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Tareo', {
        views: [{ state: 'frozen', xSplit: 6, ySplit: 5 }]
      });

      const mesActual = this.datePipe.transform(this.fechaInicial, 'MMMM yyyy', 'es-PE')?.toUpperCase() || '';
      const numDias = this.columnasdinamicas.length;
      const numColsDias = numDias * 3; // L, HH, OS por día
      // Columnas fijas: Nº(1), DNI(2), APELLIDOS(3), NOMBRES(4), CARGO(5), GUARDIAS(6)
      const colInicioAdicionales = 7 + numColsDias; // 1-indexed

      // ── Estilos reutilizables ──
      const borderThin: Partial<ExcelJS.Borders> = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };

      const borderMedium: Partial<ExcelJS.Borders> = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'medium' },
        right: { style: 'medium' },
      };

      const fillTitulo: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      const fillEncabezadoPrincipal: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B9BD5' } };
      const fillEncabezadoDias: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      const fillEncabezadoColumnas: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
      const fillFinDeSemana: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      const fillTotales: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };

      const fontBlanco: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };
      const fontTitulo: Partial<ExcelJS.Font> = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      const fontEncDias: Partial<ExcelJS.Font> = { bold: true, size: 10, color: { argb: 'FF000000' } };
      const fontEncCols: Partial<ExcelJS.Font> = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };

      const alignCenter: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' };
      const alignLeft: Partial<ExcelJS.Alignment> = { horizontal: 'left', vertical: 'middle' };

      // ── FILA 1 y 2: vacías ──
      ws.addRow([]);
      ws.addRow([]);

      // ── FILA 3: Título + días de semana + columnas adicionales ──
      const fila3Data: any[] = [`TAREO MES DE ${mesActual}`, '', '', '', '', 'GUARDIAS'];
      this.columnasdinamicas.forEach(col => {
        fila3Data.push(col.diaSemana, '', '');
      });
      fila3Data.push('TOTAL DE HORAS AL MES', 'HORAS EXTRA AL 25%', 'PAGAR', 'MOTIVO',
                     'FECHA DE INICIO', 'FECHA DE FIN', 'TOTAL DE DÍAS', 'MEDIDA', 'OBSERVACIONES');
      const row3 = ws.addRow(fila3Data);

      // Merge título A3:E3
      ws.mergeCells(3, 1, 3, 5);
      for (let c = 1; c <= 5; c++) {
        const cell = row3.getCell(c);
        cell.fill = fillTitulo;
        cell.font = fontTitulo;
        cell.alignment = alignCenter;
        cell.border = borderMedium;
      }

      // GUARDIAS (columna 6)
      const cellGuardias = row3.getCell(6);
      cellGuardias.fill = fillEncabezadoPrincipal;
      cellGuardias.font = fontBlanco;
      cellGuardias.alignment = alignCenter;
      cellGuardias.border = borderThin;

      // Merge y estilo días de semana (desde columna 7)
      for (let i = 0; i < numDias; i++) {
        const colStart = 7 + i * 3;
        const colEnd = colStart + 2;
        ws.mergeCells(3, colStart, 3, colEnd);
        for (let c = colStart; c <= colEnd; c++) {
          const cell = row3.getCell(c);
          cell.fill = fillEncabezadoDias;
          cell.font = fontEncDias;
          cell.alignment = alignCenter;
          cell.border = borderThin;
        }
      }

      // Columnas adicionales fila 3
      for (let c = colInicioAdicionales; c < colInicioAdicionales + 9; c++) {
        const cell = row3.getCell(c);
        cell.fill = fillEncabezadoPrincipal;
        cell.font = fontBlanco;
        cell.alignment = alignCenter;
        cell.border = borderThin;
      }

      // ── FILA 4: Fechas ──
      const fila4Data: any[] = ['', '', '', '', '', ''];
      this.columnasdinamicas.forEach(col => {
        fila4Data.push(col.fechaDisplay, '', '');
      });
      fila4Data.push('', '', '', '', '', '', '', '', '');
      const row4 = ws.addRow(fila4Data);

      for (let i = 0; i < numDias; i++) {
        const colStart = 7 + i * 3;
        const colEnd = colStart + 2;
        ws.mergeCells(4, colStart, 4, colEnd);
        for (let c = colStart; c <= colEnd; c++) {
          const cell = row4.getCell(c);
          cell.fill = fillEncabezadoDias;
          cell.font = fontEncDias;
          cell.alignment = alignCenter;
          cell.border = borderThin;
        }
      }

      // ── FILA 5: Encabezados (Nº, DNI, APELLIDOS, NOMBRES, CARGO, GUARDIAS, L, HH, OS...) ──
      const fila5Data: any[] = ['Nº', 'DNI', 'APELLIDOS', 'NOMBRES', 'CARGO', ''];
      this.columnasdinamicas.forEach(() => {
        fila5Data.push('L', 'HH', 'OS');
      });
      fila5Data.push('', '', '', '', '', '', '', '', '');
      const row5 = ws.addRow(fila5Data);

      for (let c = 1; c <= 6; c++) {
        const cell = row5.getCell(c);
        cell.fill = fillEncabezadoColumnas;
        cell.font = fontEncCols;
        cell.alignment = alignCenter;
        cell.border = borderThin;
      }
      for (let c = 7; c < 7 + numColsDias; c++) {
        const cell = row5.getCell(c);
        cell.fill = fillEncabezadoColumnas;
        cell.font = fontEncCols;
        cell.alignment = alignCenter;
        cell.border = borderThin;
      }

      // ── FILAS DE DATOS ──
      this.datosReporte.forEach((empleado, index) => {
        // Obtener la primera marcación para extraer datos de OT/OS
        const primeraMarcacion = this.obtenerPrimeraMarcacionDatos(empleado);

        // Fechas desde ordenTrabajo
        const fechaInicioOT = primeraMarcacion?.ordenTrabajo?.fechaInicio
          ? this.datePipe.transform(primeraMarcacion.ordenTrabajo.fechaInicio, 'dd/MM/yyyy') || ''
          : '';
        const fechaFinOT = primeraMarcacion?.ordenTrabajo?.fechaFin
          ? this.datePipe.transform(primeraMarcacion.ordenTrabajo.fechaFin, 'dd/MM/yyyy') || ''
          : '';

        // Total de días entre fechaInicio y fechaFin de la OT
        let totalDiasOT: number | string = '';
        if (primeraMarcacion?.ordenTrabajo?.fechaInicio && primeraMarcacion?.ordenTrabajo?.fechaFin) {
          const inicio = new Date(primeraMarcacion.ordenTrabajo.fechaInicio);
          const fin = new Date(primeraMarcacion.ordenTrabajo.fechaFin);
          totalDiasOT = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        }

        // codigoReferencial de ordenServicio para columna OS
        const codigoReferencialOS = primeraMarcacion?.ordenServicio?.codigoReferencial || '';

        const filaData: any[] = [
          index + 1,
          empleado.dni,
          this.obtenerApellidos(empleado.personal),
          this.obtenerNombres(empleado.personal),
          '',  // CARGO
          '.'  // GUARDIAS
        ];

        let totalHoras = 0;

        this.columnasdinamicas.forEach(col => {
          const marcacion = empleado.marcaciones[col.fecha];

          // L: vacío (empresa no disponible aún)
          const letra = '';

          let horas = 0;
          let horasTexto: string | number = '';
          if (marcacion?.entrada && marcacion?.salida) {
            horas = this.calcularHorasNumerico(marcacion.entrada, marcacion.salida);
            horasTexto = horas > 0 ? horas : '';
            totalHoras += horas;
          }

          // OS: codigoReferencial de ordenServicio
          let ordenServicio = '';
          if (marcacion?.entrada) {
            ordenServicio = codigoReferencialOS;
          }

          filaData.push(letra, horasTexto, ordenServicio);
        });

        // Columnas adicionales
        const horasExtra = totalHoras - 192;
        const horasExtraDisplay = horasExtra > 0 ? horasExtra : 0;
        const textoPagar = horasExtra > 0
          ? `PAGAR ${horasExtra} HORAS EXTRA AL 25% DEL MES DE ${mesActual}`
          : `PAGAR 0 HORAS EXTRA AL 25% DEL MES DE ${mesActual}`;

        filaData.push(
          totalHoras > 0 ? totalHoras : 0,   // TOTAL HORAS
          horasExtraDisplay,                   // HORAS EXTRA
          textoPagar,                          // PAGAR
          '',                                  // MOTIVO
          fechaInicioOT,                       // FECHA DE INICIO (de ordenTrabajo)
          fechaFinOT,                          // FECHA DE FIN (de ordenTrabajo)
          totalDiasOT,                         // TOTAL DE DÍAS (calculado de OT)
          'DIAS',                              // MEDIDA
          ''                                   // OBSERVACIONES
        );

        const row = ws.addRow(filaData);

        // ── Estilos fila de datos ──

        // Columnas fijas 1-6
        for (let c = 1; c <= 6; c++) {
          const cell = row.getCell(c);
          cell.border = borderThin;
          cell.alignment = (c >= 3 && c <= 5) ? alignLeft : alignCenter;
        }

        // Columnas de días (L, HH, OS)
        for (let i = 0; i < numDias; i++) {
          const colStart = 7 + i * 3;
          const esFinDeSemana = this.columnasdinamicas[i].diaSemana === 'SÁB' ||
                                this.columnasdinamicas[i].diaSemana === 'DOM';

          for (let c = colStart; c <= colStart + 2; c++) {
            const cell = row.getCell(c);
            cell.alignment = alignCenter;
            cell.border = borderThin;
            if (esFinDeSemana) {
              cell.fill = fillFinDeSemana;
            }
          }
        }

        // Columnas adicionales (totales)
        const colPagar = colInicioAdicionales + 2;
        const colMotivo = colInicioAdicionales + 3;
        const colObservaciones = colInicioAdicionales + 8;

        for (let c = colInicioAdicionales; c <= colInicioAdicionales + 8; c++) {
          const cell = row.getCell(c);
          cell.fill = fillTotales;
          cell.border = borderThin;
          cell.font = { bold: true, size: 10 };

          if (c === colPagar || c === colMotivo || c === colObservaciones) {
            cell.alignment = alignLeft;
          } else {
            cell.alignment = alignCenter;
          }
        }
      });

      // ── ANCHOS DE COLUMNA ──
      ws.getColumn(1).width = 5;    // Nº
      ws.getColumn(2).width = 12;   // DNI
      ws.getColumn(3).width = 25;   // APELLIDOS
      ws.getColumn(4).width = 25;   // NOMBRES
      ws.getColumn(5).width = 15;   // CARGO
      ws.getColumn(6).width = 10;   // GUARDIAS

      for (let i = 0; i < numDias; i++) {
        const colStart = 7 + i * 3;
        ws.getColumn(colStart).width = 8;      // L
        ws.getColumn(colStart + 1).width = 12;  // HH
        ws.getColumn(colStart + 2).width = 15;  // OS
      }

      // Anchos columnas adicionales
      const anchosAdicionales = [20, 18, 45, 20, 15, 15, 15, 10, 30];
      anchosAdicionales.forEach((ancho, idx) => {
        ws.getColumn(colInicioAdicionales + idx).width = ancho;
      });

      // ── GENERAR Y DESCARGAR ──
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const fechaActual = this.datePipe.transform(new Date(), 'dd-MM-yyyy');
      const nombreArchivo = `Tareo_${mesActual}_${fechaActual}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      a.click();
      window.URL.revokeObjectURL(url);

      this.showMessage('Reporte tareo descargado correctamente');

    } catch (error) {
      console.error('❌ Error al generar reporte tareo:', error);
      this.showMessage('Error al generar el reporte tareo');
    } finally {
      this.blockUI.stop();
    }
  }

  /* ================= MÉTODOS AUXILIARES ================= */

  /**
   * Obtiene los datos crudos de la primera marcación disponible del empleado
   * para extraer información de ordenTrabajo y ordenServicio.
   */
  obtenerPrimeraMarcacionDatos(empleado: EmpleadoReporte): any | null {
    for (const fecha of Object.keys(empleado.marcaciones)) {
      const marc = empleado.marcaciones[fecha];
      const datos = marc.datosEntrada || marc.datosSalida || marc.datosSalidaRefrigerio
                    || marc.datosEntradaRefrigerio || marc.datosDesconocido;
      if (datos) return datos;
    }
    return null;
  }

  numeroALetraColumna(num: number): string {
    let letra = '';
    while (num >= 0) {
      letra = String.fromCharCode((num % 26) + 65) + letra;
      num = Math.floor(num / 26) - 1;
    }
    return letra;
  }

  obtenerApellidos(nombreCompleto: string): string {
    const partes = nombreCompleto.split(',');
    return partes[0]?.trim() || '';
  }

  obtenerNombres(nombreCompleto: string): string {
    const partes = nombreCompleto.split(',');
    return partes[1]?.trim() || '';
  }

  obtenerLetraPorOrden(orden: string): string {
    if (orden.includes('SMCV')) return 'SMCV';
    if (orden.includes('CHILE')) return 'CHILE';
    if (orden.includes('EIMISA')) return 'EIMISA';

    const match = orden.match(/[A-Z]{2,}/);
    return match ? match[0] : '';
  }

  calcularHorasTrabajadas(entrada: string, salida: string): string {
    try {
      const [hE, mE] = entrada.split(':').map(Number);
      const [hS, mS] = salida.split(':').map(Number);

      const minutosEntrada = hE * 60 + mE;
      const minutosSalida = hS * 60 + mS;

      let diferenciaMinutos = minutosSalida - minutosEntrada;

      if (diferenciaMinutos < 0) {
        diferenciaMinutos += 24 * 60;
      }

      const horas = Math.floor(diferenciaMinutos / 60);
      const minutos = diferenciaMinutos % 60;

      return minutos > 0 ? `${horas}.${(minutos / 60).toFixed(1).split('.')[1]}` : `${horas}`;

    } catch (error) {
      return '';
    }
  }

  calcularHorasNumerico(entrada: string, salida: string): number {
    try {
      const [hE, mE] = entrada.split(':').map(Number);
      const [hS, mS] = salida.split(':').map(Number);

      const minutosEntrada = hE * 60 + mE;
      const minutosSalida = hS * 60 + mS;

      let diferenciaMinutos = minutosSalida - minutosEntrada;

      if (diferenciaMinutos < 0) {
        diferenciaMinutos += 24 * 60;
      }

      const horas = diferenciaMinutos / 60;

      return Math.round(horas * 100) / 100;

    } catch (error) {
      return 0;
    }
  }

  obtenerCodigoOrdenServicio(orden: string): string {
    const matchOS = orden.match(/OS[A-Z0-9]+/);
    if (matchOS) return matchOS[0];

    const matchNumerico = orden.match(/\d{10,}/);
    if (matchNumerico) return matchNumerico[0];

    return '';
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

  private construirFechaHoraLocal(jornal: string, hora: string): string | null {
    const fecha = new Date(`${jornal}T${hora}`);
    if (Number.isNaN(fecha.getTime())) {
      return null;
    }

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  }
}