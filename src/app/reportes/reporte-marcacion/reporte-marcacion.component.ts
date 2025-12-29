import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DatePipe } from '@angular/common';
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
    // Establecer el primer y último día del mes actual
    this.establecerFechasMesActual();
  }

  establecerFechasMesActual() {
    const hoy = new Date();

    // Primer día del mes
    this.fechaInicial = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // Último día del mes (día 0 del siguiente mes)
    this.fechaFinal = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    // ⏱️ Ajustar a 23:59:59
      this.fechaFinal.setHours(23, 59, 59, 999);
    console.log('📅 Fechas establecidas:', {
      inicio: this.fechaInicial,
      fin: this.fechaFinal
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarOrdenesTrabajo();
    // Cargar marcaciones automáticamente al iniciar
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
      //console.log("📅 Trayendo marcaciones desde API...");
      const fechaInicio = this.datePipe.transform(this.fechaInicial, 'yyyy-MM-dd');
      const fechaFin = this.datePipe.transform(this.fechaFinal, 'yyyy-MM-dd') + 'T23:59:59';

      if (!fechaInicio || !fechaFin) {
        throw new Error('Fechas inválidas');
      }

      const result = await firstValueFrom(
        this.apiService.getRegistroAsistencia(fechaInicio, fechaFin)
      );

      //console.log("✅ Marcaciones recibidas:", result);

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
    // Filtrar por rango de fechas (seguridad adicional)
    const fechaIni = new Date(this.fechaInicial);   // ya tiene 00:00:00
    const fechaFin = new Date(this.fechaFinal);     // ya tiene 23:59:59

    const marcacionesFiltradas = this.marcaciones.filter(m => {
      const fechaJornal = new Date(m.fecha);

     // return fechaJornal >= fechaIni && fechaJornal <= fechaFin;
      const cumpleFecha = fechaJornal >= fechaIni && fechaJornal <= fechaFin;
      const cumpleOrdenTrabajo = !this.ordenTrabajoSeleccionada ||
      m.ordenTrabajo?.id === this.ordenTrabajoSeleccionada;

      return cumpleFecha && cumpleOrdenTrabajo;
    });

    // Generar columnas dinámicas (fechas en el rango)
    this.generarColumnasFechas();

    // Agrupar por empleado, orden de servicio/trabajo y fecha
    const empleadosMap = new Map<string, EmpleadoReporte>();

    marcacionesFiltradas.forEach(marcacion => {
      const personalId = marcacion.personalId;
      const fechaKey = this.datePipe.transform(marcacion.fechaJornal, 'yyyy-MM-dd')!;
      const ordenServicioId = marcacion.ordenServicio?.id ?? 'sinOS';
      const ordenTrabajoId = marcacion.ordenTrabajo?.id ?? 'sinOT';

      // 👷‍♂️ Agrupar por colaborador + orden de servicio + orden de trabajo
         const grupoKey = `${personalId}-${ordenServicioId}-${ordenTrabajoId}`;
      //ultima modif
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
      const tipoEvento = marcacion.tipoEvento ?? 99; // Si es null/undefined, considerarlo como desconocido

      // Mapear cada tipo de evento
      switch(tipoEvento) {
        case 0: // Entrada
          empleado.marcaciones[fechaKey].entrada = hora || '';
          empleado.marcaciones[fechaKey].tardanza = marcacion.esTardanza;
          empleado.marcaciones[fechaKey].datosEntrada = marcacion;
          break;
        case 1: // Salida
          empleado.marcaciones[fechaKey].salida = hora || '';
          empleado.marcaciones[fechaKey].datosSalida = marcacion;
          break;
        case 2: // Salida Refrigerio (Inicio Almuerzo)
          empleado.marcaciones[fechaKey].salidaRefrigerio = hora || '';
          empleado.marcaciones[fechaKey].datosSalidaRefrigerio = marcacion;
          break;
        case 3: // Entrada Refrigerio (Fin Almuerzo)
          empleado.marcaciones[fechaKey].entradaRefrigerio = hora || '';
          empleado.marcaciones[fechaKey].datosEntradaRefrigerio = marcacion;
          break;
        default: // Desconocido (99 u otros)
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

  // Método antiguo (mantener por compatibilidad)
  obtenerMarcacion(empleado: EmpleadoReporte, fecha: string, tipo: 'E' | 'S'): string {
    const marcacion = empleado.marcaciones[fecha];
    if (!marcacion) return '';

    if (tipo === 'E') {
      return marcacion.entrada || '';
    } else {
      return marcacion.salida || '';
    }
  }

  // Nuevo método para obtener marcación por tipo de evento
  obtenerMarcacionPorTipo(empleado: EmpleadoReporte, fecha: string, tipoEvento: number): string {
    const marcacion = empleado.marcaciones[fecha];
    if (!marcacion) return '';

    switch(tipoEvento) {
      case 0: // Entrada
        return marcacion.entrada || '';
      case 1: // Salida
        return marcacion.salida || '';
      case 2: // Salida Refrigerio
        return marcacion.salidaRefrigerio || '';
      case 3: // Entrada Refrigerio
        return marcacion.entradaRefrigerio || '';
      case 99: // Desconocido
        return marcacion.desconocido || '';
      default:
        return '';
    }
  }

  tieneMarcacionPorTipo(empleado: EmpleadoReporte, fecha: string, tipoEvento: number): boolean {
    const marcacion = empleado.marcaciones[fecha];
    if (!marcacion) return false;

    switch (tipoEvento) {
      case 0:
        return !!(marcacion.entrada || marcacion.datosEntrada);
      case 1:
        return !!(marcacion.salida || marcacion.datosSalida);
      case 2:
        return !!(marcacion.salidaRefrigerio || marcacion.datosSalidaRefrigerio);
      case 3:
        return !!(marcacion.entradaRefrigerio || marcacion.datosEntradaRefrigerio);
      case 99:
        return !!(marcacion.desconocido || marcacion.datosDesconocido);
      default:
        return false;
    }
  }

  // Actualizar método esTardanza para aceptar tipo de evento
  esTardanza(empleado: EmpleadoReporte, fecha: string, tipoEvento: number): boolean {
    const marcacion = empleado.marcaciones[fecha];
    // Solo las entradas (tipo 0) pueden tener tardanza
    if (tipoEvento !== 0) return false;
    return marcacion?.tardanza || false;
  }

  // Método antiguo (mantener por compatibilidad)
  abrirDetalleMarcacion(empleado: EmpleadoReporte, fecha: string, tipo: 'E' | 'S') {
    const tipoEvento = tipo === 'E' ? 0 : 1;
    this.abrirDetalleMarcacionTipo(empleado, fecha, tipoEvento);
  }

  // Nuevo método para abrir detalle por tipo de evento
  abrirDetalleMarcacionTipo(empleado: EmpleadoReporte, fecha: string, tipoEvento: number) {
    const marcacion = empleado.marcaciones[fecha];
    if (!marcacion) return;

    let datos: any;
    switch(tipoEvento) {
      case 0:
        datos = marcacion.datosEntrada;
        break;
      case 1:
        datos = marcacion.datosSalida;
        break;
      case 2:
        datos = marcacion.datosSalidaRefrigerio;
        break;
      case 3:
        datos = marcacion.datosEntradaRefrigerio;
        break;
      case 99:
        datos = marcacion.datosDesconocido;
        break;
      default:
        return;
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

    const fecha = new Date(`${this.regularizacion.jornal}T${this.regularizacion.hora}`);
    if (isNaN(fecha.getTime())) {
      this.showMessage('La fecha u hora ingresada no es válida');
      return;
    }

    const payload = {
      empresaId: Number(localStorage.getItem('empresa_id')) || 0,
      personalId,
      fecha: fecha.toISOString(),
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

  // Evento cuando cambia el checkbox
  onVerTodoChanged() {
    console.log('👁️ Ver todo:', this.verTodo);
    // No es necesario recargar datos, solo cambia la vista
  }

  // Calcular colspan dinámico para el mensaje de "no hay datos"
  calcularColspan(): number {
    const baseColumns = 2; // DNI y PERSONAL
    const eventColumns = this.verTodo ? 5 : 2; // E, SR, ER, S, D : E, S
    return baseColumns + (this.columnasdinamicas.length * eventColumns);
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
      const encabezadoFechas = ['ORDEN', 'DNI', 'PERSONAL'];
      this.columnasdinamicas.forEach(col => {
        encabezadoFechas.push(`${col.diaSemana} ${col.fechaDisplay}`);
        if (this.verTodo) {
          // Agregar columnas vacías para SR, ER, S, D
          encabezadoFechas.push('');
          encabezadoFechas.push('');
          encabezadoFechas.push('');
          encabezadoFechas.push('');
        } else {
          // Solo agregar una columna vacía para S
          encabezadoFechas.push('');
        }
      });
      datosExcel.push(encabezadoFechas);

      // Crear subencabezado (segunda fila con E, S, etc.)
      const subencabezado = ['', '', '']; // Vacíos para ORDEN, DNI y PERSONAL
      this.columnasdinamicas.forEach(() => {
        if (this.verTodo) {
          subencabezado.push('E', 'SR', 'ER', 'S', 'D');
        } else {
          subencabezado.push('E', 'S');
        }
      });
      datosExcel.push(subencabezado);

      // Agregar datos de empleados
      this.datosReporte.forEach(empleado => {
        const fila: any[] = [empleado.orden, empleado.dni, empleado.personal];

        this.columnasdinamicas.forEach(col => {
          if (this.verTodo) {
            fila.push(
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 0) || '',  // E
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 2) || '',  // SR
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 3) || '',  // ER
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 1) || '',  // S
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 99) || ''  // D
            );
          } else {
            fila.push(
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 0) || '',  // E
              this.obtenerMarcacionPorTipo(empleado, col.fecha, 1) || ''   // S
            );
          }
        });

        datosExcel.push(fila);
      });

      // Crear libro de trabajo
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(datosExcel);

      // Aplicar estilos y ajustar anchos de columna
      const colWidths = [
        { wch: 25 },  // ORDEN
        { wch: 12 },  // DNI
        { wch: 35 }   // PERSONAL
      ];

      // Ancho para cada par/grupo de columnas
      this.columnasdinamicas.forEach(() => {
        if (this.verTodo) {
          colWidths.push({ wch: 6 });  // E
          colWidths.push({ wch: 6 });  // SR
          colWidths.push({ wch: 6 });  // ER
          colWidths.push({ wch: 6 });  // S
          colWidths.push({ wch: 6 });  // D
        } else {
          colWidths.push({ wch: 8 });  // E
          colWidths.push({ wch: 8 });  // S
        }
      });

      ws['!cols'] = colWidths;

      // Mergear celdas del encabezado de fechas
      const merges: XLSX.Range[] = [];
      let colIndex = 3; // Empezar después de ORDEN, DNI y PERSONAL

      this.columnasdinamicas.forEach(() => {
        if (this.verTodo) {
          // Mergear 5 columnas (E, SR, ER, S, D)
          merges.push({
            s: { r: 0, c: colIndex },
            e: { r: 0, c: colIndex + 4 }
          });
          colIndex += 5;
        } else {
          // Mergear 2 columnas (E, S)
          merges.push({
            s: { r: 0, c: colIndex },
            e: { r: 0, c: colIndex + 1 }
          });
          colIndex += 2;
        }
      });

      ws['!merges'] = merges;

      // Crear el libro
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Marcaciones');

      // Generar nombre de archivo con fecha
      const fechaActual = this.datePipe.transform(new Date(), 'dd-MM-yyyy');
      const modoVista = this.verTodo ? 'Completo' : 'Resumido';
      const nombreArchivo = `Reporte_Marcaciones_${modoVista}_${fechaActual}.xlsx`;

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
