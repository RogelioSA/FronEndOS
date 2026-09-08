import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as ExcelJS from 'exceljs';
import { ApiService } from '../../services/api.service';

export interface IndicadorArea {
  area: string;
  numeroPersonal: number;
  marcacionesRealizadas: number;
  marcacionesEsperadas: number;
  cumplimiento: number;
  personasPuntuales: number;
  puntualidad: number;
}

interface ResumenPersonal {
  id: number;
  area: string;
  esOficina: boolean;
  realizadas: number;
  esperadas: number;
  tardanza: number;
  tieneAsignacion: boolean;
  tieneVacaciones: boolean;
  tieneMarcacion: boolean;
}

@Component({
  selector: 'app-indicadores-asistencia',
  templateUrl: './indicadoresasistencia.component.html',
  styleUrl: './indicadoresasistencia.component.css',
  providers: [DatePipe],
  standalone: false
})
export class IndicadoresAsistenciaComponent {
  private readonly ordenAusenciasId = 37;
  private readonly cargosServicio = new Set(['MAESTRO', 'TECNICO CONDUCTOR', 'TECNICO', 'AYUDANTE AVANZADO', 'TECNICO MECANICO', 'AYUDANTE', 'SUPERVISOR DE SERVICIOS']);
  private readonly areasPorCargo: Record<string, string[]> = {
    'INGENIERO PLANIFICADOR': ['SERVICIOS'], 'MAESTRO': ['SERVICIOS'], 'ASISTENTE DE CONTABILIDAD': ['CONTABILIDAD Y FINANZAS'],
    'SUPERVISOR DE SERVICIOS': ['SERVICIOS'], 'TECNICO': ['SERVICIOS'], 'TECNICO CONDUCTOR': ['SERVICIOS'],
    'AYUDANTE AVANZADO': ['SERVICIOS'], 'ASISTENTE DE ALMACEN': ['ALMACEN'], 'AYUDANTE': ['SERVICIOS'],
    'GERENTE COMERCIAL Y PROYECTOS': ['CONTABILIDAD Y FINANZAS', 'COMERCIAL'], 'JEFE DE QHSE Y SGI': ['SEGURIDAD'],
    'ENCARGADO DE ALMACEN': ['ALMACEN'], 'ENFERMERA OCUPACIONAL': ['SEGURIDAD'], 'JEFE DE INGENIERIA Y DESARROLLO': ['INGENIERIA Y DESARROLLO'],
    'SUPERVISOR DE SEGURIDAD': ['SEGURIDAD'], 'MAESTRO MECANICO': ['SERVICIOS'], 'COORDINADOR DE SERVICIOS': ['SERVICIOS'],
    'INGENIERO DE DESARROLLO': ['INGENIERIA Y DESARROLLO'], 'JEFE DE SERVICIO': ['SERVICIOS'], 'TECNICO MECANICO': ['SERVICIOS'],
    'ASISTENTE DE PLANEAMIENTO': ['SERVICIOS'], 'PERSONAL DE LIMPIEZA': ['RECURSOS HUMANOS'], 'PSICOLOGA OCUPACIONAL': ['SEGURIDAD'],
    'ENCARGADO DE FINANZAS': ['CONTABILIDAD Y FINANZAS'], 'ASISTENTE DE LOGISTICA': ['LOGISTICA'], 'JEFE COMERCIAL': ['COMERCIAL'],
    'ENCARGADO DE CONTABILIDAD': ['CONTABILIDAD Y FINANZAS'], 'JEFE DE LOGISTICA Y ALMACEN': ['LOGISTICA'],
    'ASISTENTE DE RECURSOS HUMANOS': ['RECURSOS HUMANOS'], 'GERENTE DE QHSE Y SGI': ['SEGURIDAD'], 'JEFE DE RECURSOS HUMANOS': ['RECURSOS HUMANOS']
  };

  @BlockUI() blockUI!: NgBlockUI;
  fechaInicial: Date;
  fechaFinal: Date;
  textoBusqueda = '';
  indicadores: IndicadorArea[] = [];
  indicadoresFiltrados: IndicadorArea[] = [];
  total: IndicadorArea = this.crearIndicador('TOTAL');
  totalPersonalActivo = 0;
  personalSinOcupacion = 0;
  porcentajeOcupacion = 0;
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
    this.blockUI.start('Calculando indicadores de asistencia...');
    try {
      const [marcacionesR, personalR, cargosR, ordenesR, ausenciasR] = await Promise.all([
        firstValueFrom(this.apiService.getRegistroAsistencia(inicio, `${fin}T23:59:59`)),
        firstValueFrom(this.apiService.getPersonalDetalle()), firstValueFrom(this.apiService.getCargos()),
        firstValueFrom(this.apiService.listarOrdenTrabajoCabeceraSimplificado()),
        firstValueFrom(this.apiService.obtenerHorariosPorOrdenYRango(this.ordenAusenciasId, inicio, fin))
      ]);
      const ordenes = this.lista(ordenesR).filter(o => Number(o.id) !== this.ordenAusenciasId && Number(o.estado) !== 0 && this.seCruzaConPeriodo(o));
      const respuestas = await Promise.all(ordenes.map(async o => ({ ordenId: Number(o.id), respuesta: await firstValueFrom(this.apiService.obtenerHorariosPorOrdenYRango(Number(o.id), inicio, fin)) })));
      const asignaciones = respuestas.flatMap(r => this.lista(r.respuesta).map(a => ({ ...a, ordenConsultadaId: r.ordenId })));
      this.procesar(this.lista(marcacionesR), this.lista(personalR), this.lista(cargosR), asignaciones, this.lista(ausenciasR));
    } catch (error) {
      console.error('Error al calcular indicadores de asistencia:', error);
      this.indicadores = []; this.indicadoresFiltrados = []; this.mensaje = 'No se pudieron cargar los indicadores. Inténtalo nuevamente.';
    } finally { this.blockUI.stop(); }
  }

  aplicarFiltro(): void {
    const termino = this.normalizar(this.textoBusqueda);
    this.indicadoresFiltrados = termino ? this.indicadores.filter(i => this.normalizar(i.area).includes(termino)) : [...this.indicadores];
  }

  claseSemaforo(valor: number): string { return valor > 95 ? 'semaforo-verde' : valor >= 80 ? 'semaforo-ambar' : 'semaforo-rojo'; }

  private procesar(marcaciones: any[], personal: any[], cargos: any[], asignaciones: any[], ausencias: any[]): void {
    const cargosPorId = new Map(cargos.map(c => [Number(c.id), String(c.nombre ?? '')]));
    const activos = personal.filter(p => p?.persona?.estado !== false && p?.estado !== false);
    const porId = new Map<number, ResumenPersonal>();
    activos.forEach(p => {
      const id = Number(p?.persona?.id ?? p?.personaId ?? p?.id);
      if (!Number.isFinite(id)) return;
      const cargoId = Number(p?.personalCargoExterno?.cargoId);
      const cargo = cargosPorId.get(cargoId) ?? String(p?.personalCargoExterno?.cargo?.nombre ?? '');
      porId.set(id, { id, area: this.obtenerArea(cargo, p), esOficina: !this.cargosServicio.has(this.clave(cargo)), realizadas: 0,
        esperadas: 0, tardanza: 0, tieneAsignacion: false, tieneVacaciones: false, tieneMarcacion: false });
    });
    const diasLaborables = this.contarDiasLaborables();
    porId.forEach(p => { if (p.esOficina) p.esperadas = diasLaborables * 2; });

    const clavesAsignacion = new Set<string>();
    asignaciones.forEach(a => {
      const id = Number(a.personalId ?? a.personal?.id); const fecha = this.fechaClave(a.fecha);
      const resumen = porId.get(id); if (!resumen || !fecha) return;
      const clave = `${id}|${fecha}|${a.ordenTrabajoCabeceraId ?? a.ordenTrabajoId ?? a.ordenConsultadaId}`;
      if (clavesAsignacion.has(clave)) return;
      clavesAsignacion.add(clave); resumen.tieneAsignacion = true;
      if (!resumen.esOficina) resumen.esperadas += 2;
    });
    ausencias.forEach(a => { const p = porId.get(Number(a.personalId)); if (p && this.clave(a?.horarioCabecera?.nombre) === 'VAC') p.tieneVacaciones = true; });

    const grupos = new Map<string, { entrada: boolean; salida: boolean; primeraEntrada: any }>();
    marcaciones.forEach(m => {
      const id = Number(m.personalId ?? m.personal?.persona?.id ?? m.persona?.id); const fecha = this.fechaClave(m.fechaJornal ?? m.fecha);
      const p = porId.get(id); if (!p || !fecha) return;
      p.tieneMarcacion = true;
      const ot = m?.ordenTrabajo?.id ?? 'OFICINA'; const clave = `${id}|${fecha}|${ot}`;
      const grupo = grupos.get(clave) ?? { entrada: false, salida: false, primeraEntrada: null };
      if (Number(m.tipoEvento) === 0) {
        grupo.entrada = true;
        if (!grupo.primeraEntrada || new Date(m.fecha).getTime() < new Date(grupo.primeraEntrada).getTime()) grupo.primeraEntrada = m.fecha;
      }
      if (Number(m.tipoEvento) === 1) grupo.salida = true;
      grupos.set(clave, grupo);
    });
    grupos.forEach((g, clave) => {
      const p = porId.get(Number(clave.split('|')[0]))!;
      if (g.entrada && g.salida) p.realizadas += 2;
      if (clave.endsWith('|OFICINA') && g.primeraEntrada) p.tardanza += this.minutosTardanza(g.primeraEntrada);
    });

    const areas = new Map<string, IndicadorArea>();
    porId.forEach(p => {
      const indicador = areas.get(p.area) ?? this.crearIndicador(p.area);
      indicador.numeroPersonal++; indicador.marcacionesRealizadas += p.realizadas; indicador.marcacionesEsperadas += p.esperadas;
      if (p.esOficina && p.tardanza < 10) indicador.personasPuntuales++;
      areas.set(p.area, indicador);
    });
    this.indicadores = [...areas.values()].map(i => this.calcularPorcentajes(i)).sort((a, b) => a.area.localeCompare(b.area, 'es'));
    this.total = this.calcularPorcentajes(this.indicadores.reduce((t, i) => ({ ...t, numeroPersonal: t.numeroPersonal + i.numeroPersonal,
      marcacionesRealizadas: t.marcacionesRealizadas + i.marcacionesRealizadas, marcacionesEsperadas: t.marcacionesEsperadas + i.marcacionesEsperadas,
      personasPuntuales: t.personasPuntuales + i.personasPuntuales }), this.crearIndicador('TOTAL')));
    this.totalPersonalActivo = porId.size;
    this.personalSinOcupacion = [...porId.values()].filter(p => !p.tieneAsignacion && !p.tieneVacaciones && !p.tieneMarcacion).length;
    this.porcentajeOcupacion = this.porcentaje(this.totalPersonalActivo - this.personalSinOcupacion, this.totalPersonalActivo);
    this.aplicarFiltro();
  }

  async descargarExcel(): Promise<void> {
    if (!this.indicadoresFiltrados.length) { this.mensaje = 'No hay datos para exportar.'; return; }
    const libro = new ExcelJS.Workbook(); const hoja = libro.addWorksheet('Indicadores de asistencia');
    hoja.addRow(['Área', 'Nro Personal', 'Marcaciones Realizadas', 'Marcaciones Esperadas', '% Cumplimiento', 'Nro Personas Puntuales', '% Puntualidad']);
    [...this.indicadoresFiltrados, this.total].forEach(i => hoja.addRow([i.area, i.numeroPersonal, i.marcacionesRealizadas, i.marcacionesEsperadas, i.cumplimiento / 100, i.personasPuntuales, i.puntualidad / 100]));
    hoja.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; hoja.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF263B59' } };
    hoja.columns.forEach((c, index) => c.width = index === 0 ? 30 : 22); [5, 7].forEach(c => hoja.getColumn(c).numFmt = '0.00%');
    hoja.addRow([]); hoja.addRow(['Ocupación', this.porcentajeOcupacion / 100, 'Personal sin ocupación', this.personalSinOcupacion]); hoja.getColumn(2).numFmt = '0.00%';
    const buffer = await libro.xlsx.writeBuffer(); const url = URL.createObjectURL(new Blob([buffer])); const enlace = document.createElement('a');
    enlace.href = url; enlace.download = `Indicadores_asistencia_${this.datePipe.transform(this.fechaInicial, 'yyyyMMdd')}_${this.datePipe.transform(this.fechaFinal, 'yyyyMMdd')}.xlsx`; enlace.click(); URL.revokeObjectURL(url);
  }

  private crearIndicador(area: string): IndicadorArea { return { area, numeroPersonal: 0, marcacionesRealizadas: 0, marcacionesEsperadas: 0, cumplimiento: 0, personasPuntuales: 0, puntualidad: 0 }; }
  private calcularPorcentajes(i: IndicadorArea): IndicadorArea { return { ...i, cumplimiento: this.porcentaje(i.marcacionesRealizadas, i.marcacionesEsperadas), puntualidad: this.porcentaje(i.personasPuntuales, i.numeroPersonal) }; }
  private porcentaje(n: number, d: number): number { return d ? Math.round(n / d * 10000) / 100 : 0; }
  private minutosTardanza(fecha: any): number { const d = new Date(fecha); return Number.isNaN(d.getTime()) ? 0 : Math.max(0, d.getHours() * 60 + d.getMinutes() - 480); }
  private contarDiasLaborables(): number { let n = 0; const d = new Date(this.fechaInicial.getFullYear(), this.fechaInicial.getMonth(), this.fechaInicial.getDate()); const fin = new Date(this.fechaFinal.getFullYear(), this.fechaFinal.getMonth(), this.fechaFinal.getDate()); while (d <= fin) { if (d.getDay() !== 0 && d.getDay() !== 6) n++; d.setDate(d.getDate() + 1); } return n; }
  private seCruzaConPeriodo(o: any): boolean { const inicio = o.fechaInicio ? new Date(o.fechaInicio) : null; const fin = o.fechaFin || o.fechaCompromiso ? new Date(o.fechaFin ?? o.fechaCompromiso) : null; return (!inicio || inicio <= this.fechaFinal) && (!fin || fin >= this.fechaInicial); }
  private obtenerArea(cargo: string, detalle: any): string { const areas = this.areasPorCargo[this.clave(cargo)]; if (!areas?.length) return 'Por asignar'; const actual = detalle?.area?.nombre ?? detalle?.areaNombre ?? detalle?.persona?.area?.nombre; return areas.find(a => this.clave(a) === this.clave(actual)) ?? areas[0]; }
  private fechaClave(v: any): string { return this.datePipe.transform(v, 'yyyy-MM-dd') ?? ''; }
  private lista(v: any): any[] { return Array.isArray(v) ? v : v?.data ?? []; }
  private normalizar(v: string): string { return (v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  private clave(v: any): string { return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase(); }
}
