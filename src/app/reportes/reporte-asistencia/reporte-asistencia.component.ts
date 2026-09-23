import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';

interface UsuarioToken {
  cUsuario?: string;
  unique_name?: string;
  name?: string;
}

interface MarcacionPorDia {
  eventosPorTipo?: { [tipoEvento: number]: any[] };
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
  esAsignacionAusencia?: boolean;
  marcaciones: { [fecha: string]: MarcacionPorDia };
}

interface DetalleMarcacion {
  id: number;
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
  ordenTrabajoId: number | null;
  linkGoogleMaps: string;
  personalId: number;
  empresaId: number;
}

@Component({
    selector: 'app-reporte-asistencia',
    templateUrl: './reporte-asistencia.component.html',
    styleUrl: './reporte-asistencia.component.css',
    providers: [DatePipe],
    standalone: false
})
export class ReporteAsistenciaComponent {

  private readonly ordenTrabajoOficinaId = 0;
  private readonly ordenTrabajoVacacionesId = 37;
  private readonly codigosAusencia = new Set(['VAC', 'LIC', 'DM', 'DP']);

  marcaciones: any[] = [];
  vacaciones = new Map<string, string>();
  personalPorId = new Map<number, any>();
  cargosPorId = new Map<number, string>();
  datosReporte: EmpleadoReporte[] = [];
  datosAgrupados: { orden: string; empleados: EmpleadoReporte[] }[] = [];
  textoBusquedaPersonal: string = '';
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
  }

  async cargarOrdenesTrabajo() {
    try {
      const response = await firstValueFrom(
        this.apiService.listarOrdenTrabajoCabeceraSimplificado()
      );

      const ordenes = Array.isArray(response) ? response : response?.data ?? [];
      this.ordenesTrabajo = ordenes
        .filter((ot: any) => Number(ot.estado) === 1)
        .map((ot: any) => ({
          id: ot.id,
          cOrdenInterna: `${ot.nombre} - ${ot.descripcion}`,
          adjuntoId: ot.adjuntoId
        }))
        .sort((a: { cOrdenInterna: string }, b: { cOrdenInterna: string }) =>
          a.cOrdenInterna.localeCompare(b.cOrdenInterna, 'es', { sensitivity: 'base' })
        );
    } catch (error) {
      console.error('❌ Error al cargar órdenes de trabajo:', error);
      this.showMessage('Error al cargar las órdenes de trabajo');
    }
  }

  private normalizarDescripcionOrdenes(marcacion: any): any {
    const descripcionOrdenServicio = this.obtenerDescripcionConValorPorDefecto(
      marcacion.ordenServicio,
      'GENERAL'
    );
    const descripcionOrdenTrabajo = this.obtenerDescripcionConValorPorDefecto(
      marcacion.ordenTrabajo,
      'OFICINA'
    );

    return {
      ...marcacion,
      ordenServicio: {
        ...(marcacion.ordenServicio ?? {}),
        descripcion: descripcionOrdenServicio,
        Descripcion: descripcionOrdenServicio
      },
      ordenTrabajo: {
        ...(marcacion.ordenTrabajo ?? {}),
        descripcion: descripcionOrdenTrabajo,
        Descripcion: descripcionOrdenTrabajo
      }
    };
  }

  private obtenerDescripcionConValorPorDefecto(orden: any, valorPorDefecto: string): string {
    const descripcion = [orden?.descripcion, orden?.Descripcion]
      .find((valor) => typeof valor === 'string' && valor.trim());

    return descripcion ?? valorPorDefecto;
  }

  async traerMarcaciones() {
    if (this.ordenTrabajoSeleccionada === null) {
      this.showMessage('Seleccione una orden de trabajo antes de buscar');
      return;
    }

    this.blockUI.start('Cargando marcaciones...');

    try {
      const fechaInicio = this.datePipe.transform(this.fechaInicial, 'yyyy-MM-dd');
      const fechaFin = this.datePipe.transform(this.fechaFinal, 'yyyy-MM-dd') + 'T23:59:59';

      if (!fechaInicio || !fechaFin) {
        throw new Error('Fechas inválidas');
      }

      const [result, horarios, personalDetalle, cargos] = await Promise.all([
        firstValueFrom(this.apiService.getRegistroAsistencia(fechaInicio, fechaFin)),
        firstValueFrom(
          this.apiService.obtenerHorariosPorOrdenYRango(
            this.ordenTrabajoVacacionesId,
            fechaInicio,
            fechaFin.slice(0, 10)
          )
        ),
        firstValueFrom(this.apiService.getPersonalDetalle()),
        firstValueFrom(this.apiService.getCargos())
      ]);

      this.marcaciones = result.map((marcacion: any) => this.normalizarDescripcionOrdenes(marcacion));
      this.vacaciones = new Map(
        (Array.isArray(horarios) ? horarios : horarios?.data ?? [])
          .map((horario: any): [string, string] => [
            this.crearClaveVacacion(horario.personalId, horario.fecha),
            horario?.horarioCabecera?.nombre?.trim().toUpperCase() ?? ''
          ])
          .filter(([clave, codigo]: [string, string]) => !!clave && this.codigosAusencia.has(codigo))
      );
      const listaPersonal = Array.isArray(personalDetalle) ? personalDetalle : personalDetalle?.data ?? [];
      this.personalPorId = new Map(
        listaPersonal
          .map((personal: any): [number, any] => [
            Number(personal?.persona?.id ?? personal?.personaId ?? personal?.id),
            personal
          ])
          .filter(([personalId]: [number, any]) => Number.isFinite(personalId))
      );
      const listaCargos = Array.isArray(cargos) ? cargos : cargos?.data ?? [];
      this.cargosPorId = new Map(
        listaCargos
          .map((cargo: any): [number, string] => [Number(cargo.id), String(cargo.nombre ?? '').trim()])
          .filter(([cargoId, nombre]: [number, string]) => Number.isFinite(cargoId) && !!nombre)
      );
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

    const tiposEventoVisibles = new Set([0, 1, 99]);
    const marcacionesFiltradas = this.marcaciones.filter(m => {
      const fechaJornal = new Date(m.fecha);
      const cumpleFecha = fechaJornal >= fechaIni && fechaJornal <= fechaFin;
      const cumpleOrdenTrabajo = m.ordenTrabajo?.id === this.ordenTrabajoSeleccionada;
      const tipoEvento = m.tipoEvento ?? 99;
      return cumpleFecha && cumpleOrdenTrabajo && tiposEventoVisibles.has(tipoEvento);
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
        empleado.marcaciones[fechaKey] = { eventosPorTipo: {} };
      }

      const hora = this.datePipe.transform(marcacion.fecha, 'HH:mm');
      const tipoEvento = marcacion.tipoEvento ?? 99;
      const eventosDelTipo = empleado.marcaciones[fechaKey].eventosPorTipo![tipoEvento] ?? [];
      eventosDelTipo.push(marcacion);
      eventosDelTipo.sort(
        (primera, segunda) => new Date(primera.fecha).getTime() - new Date(segunda.fecha).getTime()
      );
      empleado.marcaciones[fechaKey].eventosPorTipo![tipoEvento] = eventosDelTipo;

      switch(tipoEvento) {
        case 0:
          // Si existen varias entradas conservamos la primera del jornal.
          if (!empleado.marcaciones[fechaKey].datosEntrada ||
              new Date(marcacion.fecha).getTime() < new Date(empleado.marcaciones[fechaKey].datosEntrada.fecha).getTime()) {
            empleado.marcaciones[fechaKey].entrada = hora || '';
            empleado.marcaciones[fechaKey].tardanza = marcacion.esTardanza;
            empleado.marcaciones[fechaKey].datosEntrada = marcacion;
          }
          break;
        case 1:
          // Si existen varias salidas conservamos la última del jornal.
          if (!empleado.marcaciones[fechaKey].datosSalida ||
              new Date(marcacion.fecha).getTime() > new Date(empleado.marcaciones[fechaKey].datosSalida.fecha).getTime()) {
            empleado.marcaciones[fechaKey].salida = hora || '';
            empleado.marcaciones[fechaKey].datosSalida = marcacion;
          }
          break;
        case 99:
          empleado.marcaciones[fechaKey].desconocido = hora || '';
          empleado.marcaciones[fechaKey].datosDesconocido = marcacion;
          break;
      }
    });

    this.agregarAsignacionesAusencia(empleadosMap);

    this.datosReporte = Array.from(empleadosMap.values());
    this.agruparDatosPorOrden();
    console.log("✅ Datos procesados para reporte:", this.datosReporte);
  }

  private agregarAsignacionesAusencia(empleadosMap: Map<string, EmpleadoReporte>): void {
    const personalConAusencia = new Set<number>();
    const ordenAusencias = this.ordenesTrabajo.find(
      (orden) => orden.id === this.ordenTrabajoVacacionesId
    )?.cOrdenInterna ?? 'VACACIONES';

    this.vacaciones.forEach((_codigo, clave) => {
      const personalId = Number(clave.split('|')[0]);
      if (!Number.isFinite(personalId) || personalConAusencia.has(personalId)) {
        return;
      }

      const personalDetalle = this.personalPorId.get(personalId);
      const persona = personalDetalle?.persona;
      empleadosMap.set(`ausencia-${personalId}`, {
        orden: ordenAusencias,
        dni: persona?.documentoIdentidad || 'N/A',
        personal: this.obtenerNombreCompleto(personalDetalle, persona),
        personalId,
        esAsignacionAusencia: true,
        marcaciones: {}
      });
      personalConAusencia.add(personalId);
    });
  }

  agruparDatosPorOrden() {
    const grupos = new Map<string, EmpleadoReporte[]>();
    const terminoBusqueda = this.normalizarTextoBusqueda(this.textoBusquedaPersonal);
    const empleadosFiltrados = terminoBusqueda
      ? this.datosReporte.filter((empleado) =>
          this.normalizarTextoBusqueda(empleado.dni).includes(terminoBusqueda) ||
          this.normalizarTextoBusqueda(empleado.personal).includes(terminoBusqueda)
        )
      : this.datosReporte;

    empleadosFiltrados.forEach((empleado) => {
      // Las asignaciones se conservan como un bloque independiente, incluso si
      // existen marcaciones asociadas a la Orden de Trabajo 37.
      const claveGrupo = empleado.esAsignacionAusencia
        ? `asignaciones-ausencia|${empleado.orden}`
        : `marcaciones|${empleado.orden}`;
      if (!grupos.has(claveGrupo)) {
        grupos.set(claveGrupo, []);
      }
      grupos.get(claveGrupo)!.push(empleado);
    });

    this.datosAgrupados = Array.from(grupos.values()).map((empleados) => ({
      orden: empleados[0].orden,
      empleados,
    }));
  }

  aplicarFiltroPersonal() {
    this.agruparDatosPorOrden();
  }

  private normalizarTextoBusqueda(valor: string): string {
    return (valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase();
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
    if (marcacion.ordenTrabajo?.id == null && marcacion.ordenServicio?.id == null) {
      return 'OFICINA';
    }

    const codigoOrdenServicio = marcacion.ordenServicio?.codigoOrdenInterna || marcacion.ordenServicio?.codigoReferencial;
    const nombreOT = marcacion.ordenTrabajo?.nombre;
    const descripcionOT = marcacion.ordenTrabajo?.descripcion;
    const nombreOrdenTrabajo = [nombreOT, descripcionOT].filter(Boolean).join(' - ');

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

  obtenerMarcacionesPorTipo(empleado: EmpleadoReporte, fecha: string, tipoEvento: number): any[] {
    return empleado.marcaciones[fecha]?.eventosPorTipo?.[tipoEvento] ?? [];
  }

  obtenerHoraMarcacion(marcacion: any): string {
    return this.datePipe.transform(marcacion?.fecha, 'HH:mm') || '';
  }

  obtenerHorasMarcaciones(empleado: EmpleadoReporte, fecha: string, tipoEvento: number): string {
    return this.obtenerMarcacionesPorTipo(empleado, fecha, tipoEvento)
      .map((marcacion) => this.obtenerHoraMarcacion(marcacion))
      .join(', ');
  }

  esVacacion(empleado: EmpleadoReporte, fecha: string): boolean {
    return !!empleado.esAsignacionAusencia &&
      this.vacaciones.has(this.crearClaveVacacion(empleado.personalId, fecha));
  }

  obtenerCodigoAusencia(empleado: EmpleadoReporte, fecha: string): string {
    return this.vacaciones.get(this.crearClaveVacacion(empleado.personalId, fecha)) ?? '';
  }

  tieneMarcacionEnFecha(empleado: EmpleadoReporte, fecha: string): boolean {
    const marcacion = empleado.marcaciones[fecha];
    return !!marcacion && Object.keys(marcacion).some((propiedad) =>
      propiedad.startsWith('datos') && !!(marcacion as any)[propiedad]
    );
  }

  obtenerTextoCelda(empleado: EmpleadoReporte, fecha: string, tipoEvento: number): string {
    const valor = this.obtenerMarcacionPorTipo(empleado, fecha, tipoEvento);
    if (!valor && this.esVacacion(empleado, fecha) && !this.tieneMarcacionEnFecha(empleado, fecha) &&
        (tipoEvento === 0 || tipoEvento === 1)) {
      return this.obtenerCodigoAusencia(empleado, fecha);
    }
    return valor;
  }

  private crearClaveVacacion(personalId: number, fecha: string): string {
    const fechaNormalizada = typeof fecha === 'string' ? fecha.slice(0, 10) : '';
    return personalId && fechaNormalizada ? `${personalId}|${fechaNormalizada}` : '';
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
    this.abrirDetalleDatosMarcacion(empleado, datos);
  }

  abrirDetalleDatosMarcacion(empleado: EmpleadoReporte, datos: any) {

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
      id: Number(datos.id),
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
      ordenTrabajoId: datos.ordenTrabajo?.id ?? null,
      linkGoogleMaps: linkGoogleMaps,
      personalId: Number(datos.personalId ?? empleado.personalId),
      empresaId: Number(datos.empresaId ?? datos.empresa?.id ?? 0)
    };

    this.cargarImagenRostro(datos.adjuntoId);
    this.mostrarModal = true;

    if (datos.latitud && datos.longitud) {
      setTimeout(() => {
        this.inicializarMapa(datos.latitud, datos.longitud);
      }, 100);
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


  trackByFecha(_index: number, columna: any): string {
    return columna.fecha;
  }

  trackByGrupo(_index: number, grupo: { orden: string; empleados: EmpleadoReporte[] }): string {
    const primerEmpleado = grupo.empleados[0];
    return `${grupo.orden}-${primerEmpleado?.esAsignacionAusencia ? 'ausencia' : 'marcacion'}`;
  }

  trackByEmpleado(_index: number, empleado: EmpleadoReporte): string {
    return `${empleado.personalId}-${empleado.orden}`;
  }

  trackByMarcacion(_index: number, marcacion: any): number | string {
    return marcacion.id ?? marcacion.fecha;
  }

  async buscar() {
    if (this.ordenTrabajoSeleccionada === null) {
      this.showMessage('Seleccione una orden de trabajo antes de buscar');
      return;
    }

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

  calcularColspan(): number {
    const baseColumns = 2;
    const eventColumns = 3;
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
        encabezadoFechas.push('', '');
      });
      datosExcel.push(encabezadoFechas);

      const subencabezado = ['', '', ''];
      this.columnasdinamicas.forEach(() => {
        subencabezado.push('E', 'S', 'D');
      });
      datosExcel.push(subencabezado);

      this.datosReporte.forEach(empleado => {
        const fila: any[] = [empleado.orden, empleado.dni, empleado.personal];

        this.columnasdinamicas.forEach(col => {
          fila.push(
            this.obtenerHorasMarcaciones(empleado, col.fecha, 0),
            this.obtenerHorasMarcaciones(empleado, col.fecha, 1),
            this.obtenerHorasMarcaciones(empleado, col.fecha, 99)
          );
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
        colWidths.push({ wch: 8 }, { wch: 8 }, { wch: 8 });
      });

      ws['!cols'] = colWidths;

      const merges: XLSX.Range[] = [];
      let colIndex = 3;

      this.columnasdinamicas.forEach(() => {
        merges.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + 2 } });
        colIndex += 3;
      });

      ws['!merges'] = merges;

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Marcaciones');

      const fechaActual = this.datePipe.transform(new Date(), 'dd-MM-yyyy');
      const nombreArchivo = `Detalle_Marcaciones_${fechaActual}.xlsx`;

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
