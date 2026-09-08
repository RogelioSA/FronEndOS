import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ApiService } from '../../services/api.service';

interface FechaReporteAdmin {
  fecha: string;
  fechaDisplay: string;
  diaSemana: string;
}

interface DiaMarcacionAdmin {
  entrada: string;
  salida: string;
  tardanza: number;
  ausencia: string;
}

interface EmpleadoMarcacionAdmin {
  personalId: number;
  nombreCompleto: string;
  documentoIdentidad: string;
  area: string;
  cargo: string;
  totalMarcas: number;
  minutosTardanza: number;
  dias: Record<string, DiaMarcacionAdmin>;
}

@Component({
  selector: 'app-repmarcacion-admin',
  templateUrl: './repmarcacion-admin.component.html',
  styleUrl: './repmarcacion-admin.component.css',
  providers: [DatePipe],
  standalone: false
})
export class RepmarcacionAdminComponent {
  private readonly ordenTrabajoAusenciasId = 37;
  private readonly codigosAusencia = new Set(['VAC', 'LIC', 'DM', 'DP']);
  private readonly cargosOmitidos = new Set([
    'MAESTRO',
    'TECNICO CONDUCTOR',
    'TECNICO',
    'AYUDANTE AVANZADO',
    'TECNICO MECANICO',
    'AYUDANTE',
    'SUPERVISOR DE SERVICIOS',
    'ASISTENTE DE ALMACEN'
  ]);
  private readonly areasPorCargo: Record<string, string[]> = {
    'INGENIERO PLANIFICADOR': ['SERVICIOS'],
    'MAESTRO': ['SERVICIOS'],
    'ASISTENTE DE CONTABILIDAD': ['CONTABILIDAD Y FINANZAS'],
    'SUPERVISOR DE SERVICIOS': ['SERVICIOS'],
    'TECNICO': ['SERVICIOS'],
    'TECNICO CONDUCTOR': ['SERVICIOS'],
    'AYUDANTE AVANZADO': ['SERVICIOS'],
    'ASISTENTE DE ALMACEN': ['ALMACEN'],
    'AYUDANTE': ['SERVICIOS'],
    'GERENTE COMERCIAL Y PROYECTOS': ['CONTABILIDAD Y FINANZAS', 'COMERCIAL'],
    'JEFE DE QHSE Y SGI': ['SEGURIDAD'],
    'ENCARGADO DE ALMACEN': ['ALMACEN'],
    'ENFERMERA OCUPACIONAL': ['SEGURIDAD'],
    'JEFE DE INGENIERIA Y DESARROLLO': ['INGENIERIA Y DESARROLLO'],
    'SUPERVISOR DE SEGURIDAD': ['SEGURIDAD'],
    'MAESTRO MECANICO': ['SERVICIOS'],
    'COORDINADOR DE SERVICIOS': ['SERVICIOS'],
    'INGENIERO DE DESARROLLO': ['INGENIERIA Y DESARROLLO'],
    'JEFE DE SERVICIO': ['SERVICIOS'],
    'TECNICO MECANICO': ['SERVICIOS'],
    'ASISTENTE DE PLANEAMIENTO': ['SERVICIOS'],
    'PERSONAL DE LIMPIEZA': ['RECURSOS HUMANOS'],
    'PSICOLOGA OCUPACIONAL': ['SEGURIDAD'],
    'ENCARGADO DE FINANZAS': ['CONTABILIDAD Y FINANZAS'],
    'ASISTENTE DE LOGISTICA': ['LOGISTICA'],
    'JEFE COMERCIAL': ['COMERCIAL'],
    'ENCARGADO DE CONTABILIDAD': ['CONTABILIDAD Y FINANZAS'],
    'JEFE DE LOGISTICA Y ALMACEN': ['LOGISTICA'],
    'ASISTENTE DE RECURSOS HUMANOS': ['RECURSOS HUMANOS'],
    'GERENTE DE QHSE Y SGI': ['SEGURIDAD'],
    'JEFE DE RECURSOS HUMANOS': ['RECURSOS HUMANOS']
  };

  @BlockUI() blockUI!: NgBlockUI;

  fechaInicial: Date;
  fechaFinal: Date;
  textoBusquedaPersonal = '';
  columnasFechas: FechaReporteAdmin[] = [];
  empleados: EmpleadoMarcacionAdmin[] = [];
  empleadosFiltrados: EmpleadoMarcacionAdmin[] = [];
  mensaje = '';

  constructor(private apiService: ApiService, private datePipe: DatePipe) {
    const hoy = new Date();
    this.fechaInicial = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaFinal = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  }

  ngOnInit(): void {
    void this.buscar();
  }

  async buscar(): Promise<void> {
    this.mensaje = '';
    if (!this.fechaInicial || !this.fechaFinal) {
      this.mensaje = 'Selecciona ambas fechas.';
      return;
    }
    if (this.fechaInicial > this.fechaFinal) {
      this.mensaje = 'La fecha inicial no puede ser mayor que la fecha final.';
      return;
    }

    const inicio = this.datePipe.transform(this.fechaInicial, 'yyyy-MM-dd');
    const fin = this.datePipe.transform(this.fechaFinal, 'yyyy-MM-dd');
    if (!inicio || !fin) return;

    this.blockUI.start('Cargando reporte de oficina...');
    try {
      const [marcacionesRespuesta, horariosRespuesta, personalRespuesta, cargosRespuesta] = await Promise.all([
        firstValueFrom(this.apiService.getRegistroAsistencia(inicio, `${fin}T23:59:59`)),
        firstValueFrom(this.apiService.obtenerHorariosPorOrdenYRango(this.ordenTrabajoAusenciasId, inicio, fin)),
        firstValueFrom(this.apiService.getPersonalDetalle()),
        firstValueFrom(this.apiService.getCargos())
      ]);

      this.generarColumnasFechas();
      this.procesarDatos(
        this.obtenerLista(marcacionesRespuesta),
        this.obtenerLista(horariosRespuesta),
        this.obtenerLista(personalRespuesta),
        this.obtenerLista(cargosRespuesta)
      );
    } catch (error) {
      console.error('Error al cargar el reporte administrativo de marcaciones:', error);
      this.empleados = [];
      this.empleadosFiltrados = [];
      this.mensaje = 'No se pudo cargar el reporte. Inténtalo nuevamente.';
    } finally {
      this.blockUI.stop();
    }
  }

  aplicarFiltroPersonal(): void {
    const termino = this.normalizar(this.textoBusquedaPersonal);
    this.empleadosFiltrados = termino
      ? this.empleados.filter(empleado =>
          this.normalizar(empleado.documentoIdentidad).includes(termino) ||
          this.normalizar(empleado.nombreCompleto).includes(termino))
      : [...this.empleados];
  }

  private procesarDatos(marcaciones: any[], horarios: any[], personal: any[], cargos: any[]): void {
    const personalPorId = new Map<number, any>();
    personal.forEach(detalle => {
      const id = Number(detalle?.persona?.id ?? detalle?.personaId ?? detalle?.id);
      if (Number.isFinite(id)) personalPorId.set(id, detalle);
    });
    const cargosPorId = new Map<number, string>(cargos.map(cargo => [Number(cargo.id), String(cargo.nombre ?? '')]));
    const empleadosPorId = new Map<number, EmpleadoMarcacionAdmin>();

    // OFICINA equivale exclusivamente a una orden de trabajo sin identificador.
    marcaciones.filter(marcacion => marcacion?.ordenTrabajo?.id == null).forEach(marcacion => {
      const personalId = Number(marcacion.personalId ?? marcacion.personal?.persona?.id ?? marcacion.persona?.id);
      if (!Number.isFinite(personalId)) return;
      const empleado = this.obtenerOCrearEmpleado(empleadosPorId, personalPorId, cargosPorId, personalId, marcacion);
      const fecha = this.datePipe.transform(marcacion.fechaJornal ?? marcacion.fecha, 'yyyy-MM-dd');
      if (!fecha || !empleado.dias[fecha]) return;

      const evento = Number(marcacion.tipoEvento);
      const hora = this.datePipe.transform(marcacion.fecha, 'HH:mm') ?? '';
      const dia = empleado.dias[fecha];
      if (evento === 0) {
        if (!dia.entrada || hora < dia.entrada) {
          empleado.minutosTardanza -= dia.tardanza;
          dia.entrada = hora;
          dia.tardanza = this.obtenerMinutosTardanza(hora);
          empleado.minutosTardanza += dia.tardanza;
        }
      } else if (evento === 1) {
        if (!dia.salida || hora > dia.salida) dia.salida = hora;
      }
      if (evento === 0 || evento === 1) empleado.totalMarcas++;
    });

    horarios.forEach(horario => {
      const codigo = String(horario?.horarioCabecera?.nombre ?? '').trim().toUpperCase();
      if (!this.codigosAusencia.has(codigo)) return;
      const personalId = Number(horario.personalId);
      if (!Number.isFinite(personalId)) return;
      const empleado = this.obtenerOCrearEmpleado(empleadosPorId, personalPorId, cargosPorId, personalId);
      const fecha = this.datePipe.transform(horario.fecha, 'yyyy-MM-dd');
      if (fecha && empleado.dias[fecha]) empleado.dias[fecha].ausencia = codigo;
    });

    this.empleados = Array.from(empleadosPorId.values())
      .filter(empleado => !this.cargosOmitidos.has(this.normalizarClave(empleado.cargo)))
      .sort((a, b) =>
      a.nombreCompleto.localeCompare(b.nombreCompleto, 'es', { sensitivity: 'base' })
    );
    this.aplicarFiltroPersonal();
  }

  private obtenerOCrearEmpleado(
    empleados: Map<number, EmpleadoMarcacionAdmin>,
    personalPorId: Map<number, any>,
    cargosPorId: Map<number, string>,
    personalId: number,
    marcacion?: any
  ): EmpleadoMarcacionAdmin {
    const existente = empleados.get(personalId);
    if (existente) return existente;
    const detalle = personalPorId.get(personalId) ?? marcacion?.personal ?? {};
    const persona = marcacion?.persona ?? detalle?.persona ?? marcacion?.personal?.persona ?? {};
    const documento = String(persona.documentoIdentidad ?? 'N/A');
    const cargoId = Number(
      marcacion?.personalCargoExterno?.cargoId ?? detalle?.personalCargoExterno?.cargoId
    );
    const cargo = Number.isFinite(cargoId)
      ? cargosPorId.get(cargoId) ?? detalle?.personalCargoExterno?.cargo?.nombre ?? ''
      : detalle?.personalCargoExterno?.cargo?.nombre ?? '';
    const dias = Object.fromEntries(this.columnasFechas.map(columna => [columna.fecha, {
      entrada: '', salida: '', tardanza: 0, ausencia: ''
    }]));
    const empleado: EmpleadoMarcacionAdmin = {
      personalId,
      nombreCompleto: this.obtenerNombreCompleto(persona),
      documentoIdentidad: documento,
      area: this.obtenerArea(cargo, detalle, persona),
      // Misma extracción empleada por descargarReporteTareo() del reporte original.
      cargo,
      totalMarcas: 0,
      minutosTardanza: 0,
      dias
    };
    empleados.set(personalId, empleado);
    return empleado;
  }

  private obtenerArea(cargo: string, detalle: any, persona: any): string {
    const areas = this.areasPorCargo[this.normalizarClave(cargo)];
    if (!areas?.length) return 'Por asignar';

    // El cargo Gerente Comercial y Proyectos aparece en dos áreas de la tabla.
    // Si el registro ya contiene una de ellas, se conserva para desambiguarlo.
    const areaActual = detalle?.area?.nombre ?? detalle?.areaNombre
      ?? persona?.area?.nombre ?? persona?.areaNombre;
    const areaCoincidente = areas.find(area => this.normalizarClave(area) === this.normalizarClave(areaActual));
    return areaCoincidente ?? areas[0];
  }

  private obtenerNombreCompleto(persona: any): string {
    if (persona?.nombreCompleto) return String(persona.nombreCompleto);
    const apellidos = [persona?.apellidoPaterno, persona?.apellidoMaterno].filter(Boolean).join(' ');
    return [apellidos, persona?.nombres].filter(Boolean).join(', ') || 'Sin información';
  }

  private generarColumnasFechas(): void {
    this.columnasFechas = [];
    const fecha = new Date(this.fechaInicial.getFullYear(), this.fechaInicial.getMonth(), this.fechaInicial.getDate());
    const fin = new Date(this.fechaFinal.getFullYear(), this.fechaFinal.getMonth(), this.fechaFinal.getDate());
    const dias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    while (fecha <= fin) {
      if (fecha.getDay() !== 0 && fecha.getDay() !== 6) {
        this.columnasFechas.push({
          fecha: this.datePipe.transform(fecha, 'yyyy-MM-dd')!,
          fechaDisplay: this.datePipe.transform(fecha, 'dd/MM/yyyy')!,
          diaSemana: dias[fecha.getDay()]
        });
      }
      fecha.setDate(fecha.getDate() + 1);
    }
  }

  private obtenerLista(respuesta: any): any[] {
    return Array.isArray(respuesta) ? respuesta : respuesta?.data ?? [];
  }

  private obtenerMinutosTardanza(horaIngreso: string): number {
    const [horas, minutos] = horaIngreso.split(':').map(Number);
    if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return 0;
    const minutosIngreso = horas * 60 + minutos;
    const minutosHorarioIngreso = 8 * 60;
    return Math.max(0, minutosIngreso - minutosHorarioIngreso);
  }

  private normalizar(valor: string): string {
    return (valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private normalizarClave(valor: unknown): string {
    return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ').trim().toUpperCase();
  }
}
