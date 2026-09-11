import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as ExcelJS from 'exceljs';
import { ApiService } from '../../services/api.service';

interface FechaServicio {
  fecha: string;
  fechaDisplay: string;
  diaSemana: string;
}

export interface DetalleServicio {
  ordenTrabajoId: number;
  ordenServicio: string;
  entrada: string;
  salida: string;
  minutos: number | null;
  horas: number | null;
}

interface DiaServicio {
  detalles: DetalleServicio[];
  totalMinutos: number;
}

interface EmpleadoServicio {
  personalId: number;
  nombreCompleto: string;
  documentoIdentidad: string;
  area: string;
  cargo: string;
  totalMinutos: number;
  totalHoras: number;
  dias: Record<string, DiaServicio>;
}

@Component({
  selector: 'app-repmarcacion-servicio',
  templateUrl: './repmarcacion-servicio.component.html',
  styleUrl: './repmarcacion-servicio.component.css',
  providers: [DatePipe],
  standalone: false
})
export class RepmarcacionServicioComponent {
  private readonly areasPorCargo: Record<string, string[]> = {
    'INGENIERO PLANIFICADOR': ['SERVICIOS'], 'MAESTRO': ['SERVICIOS'],
    'ASISTENTE DE CONTABILIDAD': ['CONTABILIDAD Y FINANZAS'], 'SUPERVISOR DE SERVICIOS': ['SERVICIOS'],
    'TECNICO': ['SERVICIOS'], 'TECNICO CONDUCTOR': ['SERVICIOS'], 'AYUDANTE AVANZADO': ['SERVICIOS'],
    'ASISTENTE DE ALMACEN': ['ALMACEN'], 'AYUDANTE': ['SERVICIOS'],
    'GERENTE COMERCIAL Y PROYECTOS': ['CONTABILIDAD Y FINANZAS', 'COMERCIAL'],
    'JEFE DE QHSE Y SGI': ['SEGURIDAD'], 'ENCARGADO DE ALMACEN': ['ALMACEN'],
    'ENFERMERA OCUPACIONAL': ['SEGURIDAD'], 'JEFE DE INGENIERIA Y DESARROLLO': ['INGENIERIA Y DESARROLLO'],
    'SUPERVISOR DE SEGURIDAD': ['SEGURIDAD'], 'MAESTRO MECANICO': ['SERVICIOS'],
    'COORDINADOR DE SERVICIOS': ['SERVICIOS'], 'INGENIERO DE DESARROLLO': ['INGENIERIA Y DESARROLLO'],
    'JEFE DE SERVICIO': ['SERVICIOS'], 'TECNICO MECANICO': ['SERVICIOS'],
    'ASISTENTE DE PLANEAMIENTO': ['SERVICIOS'], 'PERSONAL DE LIMPIEZA': ['RECURSOS HUMANOS'],
    'PSICOLOGA OCUPACIONAL': ['SEGURIDAD'], 'ENCARGADO DE FINANZAS': ['CONTABILIDAD Y FINANZAS'],
    'ASISTENTE DE LOGISTICA': ['LOGISTICA'], 'JEFE COMERCIAL': ['COMERCIAL'],
    'ENCARGADO DE CONTABILIDAD': ['CONTABILIDAD Y FINANZAS'], 'JEFE DE LOGISTICA Y ALMACEN': ['LOGISTICA'],
    'ASISTENTE DE RECURSOS HUMANOS': ['RECURSOS HUMANOS'], 'GERENTE DE QHSE Y SGI': ['SEGURIDAD'],
    'JEFE DE RECURSOS HUMANOS': ['RECURSOS HUMANOS']
  };

  @BlockUI() blockUI!: NgBlockUI;
  fechaInicial: Date;
  fechaFinal: Date;
  textoBusquedaPersonal = '';
  columnasFechas: FechaServicio[] = [];
  empleados: EmpleadoServicio[] = [];
  empleadosFiltrados: EmpleadoServicio[] = [];
  mensaje = '';

  constructor(private apiService: ApiService, private datePipe: DatePipe) {
    const hoy = new Date();
    this.fechaInicial = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaFinal = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  }

  ngOnInit(): void { void this.buscar(); }

  async buscar(): Promise<void> {
    this.mensaje = '';
    if (!this.fechaInicial || !this.fechaFinal) { this.mensaje = 'Selecciona ambas fechas.'; return; }
    if (this.fechaInicial > this.fechaFinal) { this.mensaje = 'La fecha inicial no puede ser mayor que la fecha final.'; return; }
    const inicio = this.datePipe.transform(this.fechaInicial, 'yyyy-MM-dd');
    const fin = this.datePipe.transform(this.fechaFinal, 'yyyy-MM-dd');
    if (!inicio || !fin) return;
    this.blockUI.start('Consultando información...');
    try {
      const [marcaciones, personal, cargos] = await Promise.all([
        firstValueFrom(this.apiService.getRegistroAsistencia(inicio, `${fin}T23:59:59`)),
        firstValueFrom(this.apiService.getPersonalDetalle()),
        firstValueFrom(this.apiService.getCargos())
      ]);
      this.generarColumnasFechas();
      this.procesarDatos(this.obtenerLista(marcaciones), this.obtenerLista(personal), this.obtenerLista(cargos));
    } catch (error) {
      console.error('Error al cargar el reporte de servicios:', error);
      this.empleados = []; this.empleadosFiltrados = [];
      this.mensaje = 'No se pudo cargar el reporte. Inténtalo nuevamente.';
    } finally { this.blockUI.stop(); }
  }

  aplicarFiltroPersonal(): void {
    const termino = this.normalizar(this.textoBusquedaPersonal);
    this.empleadosFiltrados = termino ? this.empleados.filter(e =>
      this.normalizar(e.documentoIdentidad).includes(termino) || this.normalizar(e.nombreCompleto).includes(termino)
    ) : [...this.empleados];
  }

  private procesarDatos(marcaciones: any[], personal: any[], cargos: any[]): void {
    const personalPorId = new Map<number, any>();
    personal.forEach(p => personalPorId.set(Number(p?.persona?.id ?? p?.personaId ?? p?.id), p));
    const cargosPorId = new Map<number, string>(cargos.map(c => [Number(c.id), String(c.nombre ?? '').trim()]));
    const grupos = new Map<string, any[]>();
    marcaciones.filter(m => m?.ordenTrabajo?.id != null).forEach(m => {
      const personalId = Number(m.personalId ?? m.personal?.persona?.id ?? m.persona?.id);
      const fecha = this.datePipe.transform(m.fechaJornal ?? m.fecha, 'yyyy-MM-dd');
      if (!Number.isFinite(personalId) || !fecha || !this.columnasFechas.some(c => c.fecha === fecha)) return;
      const clave = `${personalId}|${fecha}|${m.ordenTrabajo.id}`;
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave)!.push(m);
    });

    const porEmpleado = new Map<number, EmpleadoServicio>();
    grupos.forEach(registros => {
      const base = registros[0];
      const personalId = Number(base.personalId ?? base.personal?.persona?.id ?? base.persona?.id);
      const fecha = this.datePipe.transform(base.fechaJornal ?? base.fecha, 'yyyy-MM-dd')!;
      let empleado = porEmpleado.get(personalId);
      if (!empleado) {
        const ficha = personalPorId.get(personalId) ?? base.personal ?? {};
        const persona = base.persona ?? ficha?.persona ?? base.personal?.persona ?? {};
        const cargoId = Number(base?.personalCargoExterno?.cargoId ?? ficha?.personalCargoExterno?.cargoId);
        const cargo = Number.isFinite(cargoId) ? cargosPorId.get(cargoId) ?? '' : '';
        empleado = {
          personalId, nombreCompleto: this.obtenerNombreCompleto(persona),
          documentoIdentidad: String(persona.documentoIdentidad ?? 'N/A'),
          area: this.obtenerArea(cargo, ficha, persona), cargo, totalMinutos: 0, totalHoras: 0,
          dias: Object.fromEntries(this.columnasFechas.map(c => [c.fecha, { detalles: [], totalMinutos: 0 }]))
        };
        porEmpleado.set(personalId, empleado);
      }
      const entradas = registros.filter(r => Number(r.tipoEvento) === 0).sort(this.compararFecha);
      const salidas = registros.filter(r => Number(r.tipoEvento) === 1).sort(this.compararFecha);
      const entrada = entradas[0];
      const salida = salidas[salidas.length - 1];
      const minutos = this.calcularMinutos(entrada, salida);
      const detalle: DetalleServicio = {
        ordenTrabajoId: Number(base.ordenTrabajo.id),
        ordenServicio: String(base.ordenTrabajo.nombre ?? base.ordenTrabajo.descripcion ?? ''),
        entrada: entrada ? this.datePipe.transform(entrada.fecha, 'HH:mm') ?? '' : '',
        salida: salida ? this.datePipe.transform(salida.fecha, 'HH:mm') ?? '' : '',
        minutos, horas: minutos === null ? null : this.minutosAHoras(minutos)
      };
      empleado.dias[fecha].detalles.push(detalle);
      if (minutos !== null) { empleado.dias[fecha].totalMinutos += minutos; empleado.totalMinutos += minutos; }
    });
    porEmpleado.forEach(e => {
      e.totalHoras = this.minutosAHoras(e.totalMinutos);
      Object.values(e.dias).forEach(d => d.detalles.sort((a, b) => a.entrada.localeCompare(b.entrada)));
    });
    this.empleados = Array.from(porEmpleado.values()).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));
    this.aplicarFiltroPersonal();
  }

  private compararFecha(a: any, b: any): number { return new Date(a.fecha).getTime() - new Date(b.fecha).getTime(); }

  private calcularMinutos(entrada: any, salida: any): number | null {
    if (!entrada?.fecha || !salida?.fecha) return null;
    const inicio = new Date(entrada.fecha).getTime(); const fin = new Date(salida.fecha).getTime();
    const descanso = Number(entrada.minutosDescanso ?? salida.minutosDescanso ?? 0);
    if (![inicio, fin, descanso].every(Number.isFinite)) return null;
    const minutos = (fin - inicio) / 60000 - descanso;
    return minutos >= 0 ? minutos : null;
  }

  private minutosAHoras(minutos: number): number { return Math.round(minutos / 60 * 100) / 100; }
  horasDetalle(dia: DiaServicio): string { return dia.detalles.map(d => d.horas === null ? '-1' : String(d.horas)).join('\n'); }
  valoresDetalle(dia: DiaServicio, campo: 'ordenServicio' | 'entrada' | 'salida'): string {
    return dia.detalles.map(d => d[campo] || '—').join('\n');
  }

  async descargarExcel(): Promise<void> {
    if (!this.empleadosFiltrados.length) { this.mensaje = 'No hay datos para exportar.'; return; }
    this.blockUI.start('Generando reporte Excel...');
    try {
      const libro = new ExcelJS.Workbook();
      const hoja = libro.addWorksheet('Servicios', { views: [{ state: 'frozen', xSplit: 2, ySplit: 2 }] });
      const fijas = ['Nro', 'Apellidos y Nombres', 'NroDoc', 'Área', 'Cargo', 'Total HH'];
      const principal = hoja.addRow(fijas); const secundaria = hoja.addRow(fijas.map(() => ''));
      fijas.forEach((_, i) => hoja.mergeCells(1, i + 1, 2, i + 1));
      this.columnasFechas.forEach((fecha, i) => {
        const inicio = fijas.length + 1 + i * 4;
        hoja.mergeCells(1, inicio, 1, inicio + 3); principal.getCell(inicio).value = `${fecha.diaSemana} ${fecha.fechaDisplay}`;
        ['OS', 'E', 'S', 'HH'].forEach((v, j) => secundaria.getCell(inicio + j).value = v);
      });
      [principal, secundaria].forEach((fila, indice) => fila.eachCell({ includeEmpty: true }, celda => {
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: indice ? 'FFDCE8F7' : 'FF263B59' } };
        celda.font = { bold: true, color: { argb: indice ? 'FF263B59' : 'FFFFFFFF' } };
        celda.alignment = { horizontal: 'center', vertical: 'middle' };
      }));
      this.empleadosFiltrados.forEach((e, i) => {
        const valores: (string | number)[] = [i + 1, e.nombreCompleto, e.documentoIdentidad, e.area, e.cargo || '—', e.totalHoras];
        this.columnasFechas.forEach(c => { const d = e.dias[c.fecha]; valores.push(this.valoresDetalle(d, 'ordenServicio'), this.valoresDetalle(d, 'entrada'), this.valoresDetalle(d, 'salida'), this.horasDetalle(d)); });
        const fila = hoja.addRow(valores); fila.eachCell({ includeEmpty: true }, celda => { celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; celda.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }; });
        fila.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
      });
      [6, 32, 14, 24, 25, 12].forEach((w, i) => hoja.getColumn(i + 1).width = w);
      this.columnasFechas.forEach((_, i) => { const c = fijas.length + 1 + i * 4; [22, 8, 8, 9].forEach((w, j) => hoja.getColumn(c + j).width = w); });
      const buffer = await libro.xlsx.writeBuffer(); const url = URL.createObjectURL(new Blob([buffer]));
      const enlace = document.createElement('a'); enlace.href = url; enlace.download = `Reporte_servicios_${this.datePipe.transform(this.fechaInicial, 'yyyyMMdd')}_${this.datePipe.transform(this.fechaFinal, 'yyyyMMdd')}.xlsx`; enlace.click(); URL.revokeObjectURL(url);
    } catch (error) { console.error('Error al generar el reporte de servicios:', error); this.mensaje = 'No se pudo generar el archivo Excel.'; }
    finally { this.blockUI.stop(); }
  }

  private generarColumnasFechas(): void {
    this.columnasFechas = []; const fecha = new Date(this.fechaInicial.getFullYear(), this.fechaInicial.getMonth(), this.fechaInicial.getDate());
    const fin = new Date(this.fechaFinal.getFullYear(), this.fechaFinal.getMonth(), this.fechaFinal.getDate());
    const dias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    while (fecha <= fin) { if (fecha.getDay() !== 0 && fecha.getDay() !== 6) this.columnasFechas.push({ fecha: this.datePipe.transform(fecha, 'yyyy-MM-dd')!, fechaDisplay: this.datePipe.transform(fecha, 'dd/MM/yyyy')!, diaSemana: dias[fecha.getDay()] }); fecha.setDate(fecha.getDate() + 1); }
  }
  private obtenerArea(cargo: string, detalle: any, persona: any): string {
    const areas = this.areasPorCargo[this.normalizarClave(cargo)]; if (!areas?.length) return 'Por asignar';
    const actual = detalle?.area?.nombre ?? detalle?.areaNombre ?? persona?.area?.nombre ?? persona?.areaNombre;
    return areas.find(a => this.normalizarClave(a) === this.normalizarClave(actual)) ?? areas[0];
  }
  private obtenerNombreCompleto(p: any): string { if (p?.nombreCompleto) return String(p.nombreCompleto); const apellidos = [p?.apellidoPaterno, p?.apellidoMaterno].filter(Boolean).join(' '); return [apellidos, p?.nombres].filter(Boolean).join(', ') || 'Sin información'; }
  private obtenerLista(r: any): any[] { return Array.isArray(r) ? r : r?.data ?? []; }
  private normalizar(v: string): string { return (v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  private normalizarClave(v: unknown): string { return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase(); }
}
