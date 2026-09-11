import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ApiService } from '../../services/api.service';
import * as ExcelJS from 'exceljs';

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
  horasTrabajadas: number;
}

interface EmpleadoMarcacionAdmin {
  personalId: number;
  nombreCompleto: string;
  documentoIdentidad: string;
  area: string;
  cargo: string;
  totalMarcas: number;
  minutosTardanza: number;
  totalHorasTrabajadas: number;
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
    'SUPERVISOR DE SEGURIDAD'
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

    this.blockUI.start('Consultando información...');
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

  async descargarExcel(): Promise<void> {
    if (this.empleadosFiltrados.length === 0) {
      this.mensaje = 'No hay datos para exportar.';
      return;
    }

    this.blockUI.start('Generando reporte Excel...');
    try {
      const workbook = new ExcelJS.Workbook();
      const hoja = workbook.addWorksheet('Reporte administrativo', {
        views: [{ state: 'frozen', xSplit: 2, ySplit: 2 }]
      });
      const borde: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FFDCE3EC' } },
        bottom: { style: 'thin', color: { argb: 'FFDCE3EC' } },
        left: { style: 'thin', color: { argb: 'FFDCE3EC' } },
        right: { style: 'thin', color: { argb: 'FFDCE3EC' } }
      };
      const alineacion: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' };
      const relleno = (argb: string): ExcelJS.Fill => ({
        type: 'pattern', pattern: 'solid', fgColor: { argb }
      });
      const columnasFijas = ['Nro', 'Apellidos y Nombres', 'NroDoc', 'Área', 'Cargo', 'Total Marcas', 'Min. Tardanzas', 'Total HH'];
      const filaPrincipal = hoja.addRow(columnasFijas);
      const filaSecundaria = hoja.addRow(columnasFijas.map(() => ''));

      columnasFijas.forEach((_, indice) => hoja.mergeCells(1, indice + 1, 2, indice + 1));
      this.columnasFechas.forEach((columna, indice) => {
        const inicio = columnasFijas.length + 1 + indice * 4;
        hoja.mergeCells(1, inicio, 1, inicio + 3);
        filaPrincipal.getCell(inicio).value = `${columna.diaSemana} ${columna.fechaDisplay}`;
        ['E', 'TARD.', 'S', 'HH'].forEach((titulo, subindice) => {
          filaSecundaria.getCell(inicio + subindice).value = titulo;
        });
      });

      [filaPrincipal, filaSecundaria].forEach((fila, indiceFila) => {
        for (let columna = 1; columna <= columnasFijas.length + this.columnasFechas.length * 4; columna++) {
          const celda = fila.getCell(columna);
          celda.fill = relleno(indiceFila === 0 ? 'FF263B59' : 'FFDCE8F7');
          celda.font = { bold: true, color: { argb: indiceFila === 0 ? 'FFFFFFFF' : 'FF263B59' } };
          celda.alignment = alineacion;
          celda.border = borde;
        }
      });

      this.empleadosFiltrados.forEach((empleado, indiceEmpleado) => {
        const valores: Array<string | number> = [
          indiceEmpleado + 1,
          empleado.nombreCompleto,
          empleado.documentoIdentidad,
          empleado.area,
          empleado.cargo || '—',
          empleado.totalMarcas,
          empleado.minutosTardanza,
          empleado.totalHorasTrabajadas
        ];
        this.columnasFechas.forEach(columna => {
          const dia = empleado.dias[columna.fecha];
          valores.push(
            dia.ausencia || dia.entrada,
            dia.tardanza > 0 ? dia.tardanza : '',
            dia.ausencia || dia.salida,
            dia.horasTrabajadas
          );
        });
        const fila = hoja.addRow(valores);
        fila.eachCell({ includeEmpty: true }, celda => {
          celda.border = borde;
          celda.alignment = alineacion;
          celda.font = { size: 9 };
        });
        fila.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
        fila.getCell(6).font = { bold: true, color: { argb: 'FF315F9E' }, size: 9 };
        if (empleado.minutosTardanza > 0) {
          fila.getCell(7).fill = relleno('FFFEE2E2');
          fila.getCell(7).font = { bold: true, color: { argb: 'FFB42318' }, size: 9 };
        }
        this.columnasFechas.forEach((columna, indiceDia) => {
          const dia = empleado.dias[columna.fecha];
          const inicio = columnasFijas.length + 1 + indiceDia * 4;
          if (dia.ausencia) {
            fila.getCell(inicio).fill = relleno('FFFFF1B8');
            fila.getCell(inicio + 2).fill = relleno('FFFFF1B8');
          }
          const celdaTardanza = fila.getCell(inicio + 1);
          celdaTardanza.fill = dia.tardanza > 0 ? relleno('FFFEE2E2') : relleno('FFDCFCE7');
          celdaTardanza.font = {
            bold: dia.tardanza > 0,
            color: { argb: dia.tardanza > 0 ? 'FFB42318' : 'FF166534' },
            size: 9
          };
        });
      });

      [6, 32, 14, 24, 28, 14, 16, 12].forEach((ancho, indice) => hoja.getColumn(indice + 1).width = ancho);
      this.columnasFechas.forEach((_, indice) => {
        const inicio = columnasFijas.length + 1 + indice * 4;
        hoja.getColumn(inicio).width = 9;
        hoja.getColumn(inicio + 1).width = 9;
        hoja.getColumn(inicio + 2).width = 9;
        hoja.getColumn(inicio + 3).width = 9;
      });
      hoja.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: columnasFijas.length } };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `Reporte_administrativo_${this.datePipe.transform(this.fechaInicial, 'yyyyMMdd')}_${this.datePipe.transform(this.fechaFinal, 'yyyyMMdd')}.xlsx`;
      enlace.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar el reporte administrativo en Excel:', error);
      this.mensaje = 'No se pudo generar el archivo Excel.';
    } finally {
      this.blockUI.stop();
    }
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

    empleadosPorId.forEach(empleado => {
      empleado.totalHorasTrabajadas = 0;
      Object.values(empleado.dias).forEach(dia => {
        dia.horasTrabajadas = this.obtenerHorasTrabajadas(dia.entrada, dia.salida);
        empleado.totalHorasTrabajadas += dia.horasTrabajadas;
      });
      empleado.totalHorasTrabajadas = this.redondearHoras(empleado.totalHorasTrabajadas);
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
      entrada: '', salida: '', tardanza: 0, ausencia: '', horasTrabajadas: 0
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
      totalHorasTrabajadas: 0,
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

  private obtenerHorasTrabajadas(horaEntrada: string, horaSalida: string): number {
    if (!horaEntrada || !horaSalida) return 0;
    const entrada = this.obtenerMinutos(horaEntrada);
    const salida = this.obtenerMinutos(horaSalida);
    if (entrada === null || salida === null || salida < entrada) return 0;
    return this.redondearHoras((salida - entrada) / 60);
  }

  private obtenerMinutos(hora: string): number | null {
    const [horas, minutos] = hora.split(':').map(Number);
    if (!Number.isInteger(horas) || !Number.isInteger(minutos) || horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
      return null;
    }
    return horas * 60 + minutos;
  }

  private redondearHoras(horas: number): number {
    return Math.round(horas * 100) / 100;
  }

  private normalizar(valor: string): string {
    return (valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private normalizarClave(valor: unknown): string {
    return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ').trim().toUpperCase();
  }
}
