import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';

interface MarcacionDatosRow {
  sedeProyecto: string;
  empleado: string;
  doc: string;
  fecha: string;
  iprog: string;
  ingreso: string;
  sprod: string;
  salida: string;
  diferencia: string;
}

@Component({
  selector: 'app-marcacion-datos',
  templateUrl: './marcacion-datos.component.html',
  styleUrl: './marcacion-datos.component.css',
  providers: [DatePipe],
  standalone: false
})
export class MarcacionDatosComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;

  now: Date = new Date();
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();

  registros: any[] = [];
  datos: MarcacionDatosRow[] = [];

  constructor(private apiService: ApiService, private datePipe: DatePipe) {}

  async ngOnInit(): Promise<void> {
    this.establecerFechasMesActual();
    await this.buscar();
  }

  establecerFechasMesActual() {
    const hoy = new Date();
    this.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    this.fechaHasta.setHours(23, 59, 59, 999);
  }

  async buscar() {
    this.blockUI.start('Cargando marcaciones...');

    try {
      const fechaInicio = this.datePipe.transform(this.fechaDesde, 'yyyy-MM-dd');
      const fechaFin = this.datePipe.transform(this.fechaHasta, 'yyyy-MM-dd') + 'T23:59:59';

      if (!fechaInicio || !fechaFin) {
        throw new Error('Fechas inválidas');
      }

      const result = await firstValueFrom(
        this.apiService.getRegistroAsistencia(fechaInicio, fechaFin)
      );

      this.registros = result;
      this.procesarDatos();
    } catch (error) {
      console.error('❌ Error trayendo las marcaciones:', error);
      alert('Error al cargar las marcaciones');
    } finally {
      this.blockUI.stop();
    }
  }

  procesarDatos() {
    const datosMap = new Map<string, MarcacionDatosRow>();

    this.registros.forEach(registro => {
      const fechaJornal = registro.fechaJornal || this.datePipe.transform(registro.fecha, 'yyyy-MM-dd') || '';
      const key = `${registro.personalId}-${fechaJornal}-${registro.ordenTrabajo?.id ?? 'sinOT'}`;

      if (!datosMap.has(key)) {
        datosMap.set(key, {
          sedeProyecto: registro.ordenTrabajo?.nombre || 'Sin orden',
          empleado: this.obtenerNombreCompleto(registro.persona || registro.personal?.persona),
          doc: registro.persona?.documentoIdentidad || registro.personal?.persona?.documentoIdentidad || 'N/A',
          fecha: fechaJornal,
          iprog: '07:00:00',
          ingreso: '',
          sprod: '19:00:00',
          salida: '',
          diferencia: ''
        });
      }

      const row = datosMap.get(key)!;
      const hora = this.datePipe.transform(registro.fecha, 'HH:mm:ss') || '';

      if (registro.tipoEvento === 0) {
        row.ingreso = hora;
      }

      if (registro.tipoEvento === 1) {
        row.salida = hora;
        row.diferencia = this.calcularDiferencia(registro.fecha, fechaJornal);
      }
    });

    this.datos = Array.from(datosMap.values()).sort((a, b) => {
      const empleadoCompare = a.empleado.localeCompare(b.empleado, 'es', { sensitivity: 'base' });
      if (empleadoCompare !== 0) {
        return empleadoCompare;
      }

      return a.fecha.localeCompare(b.fecha);
    });
  }

  obtenerNombreCompleto(persona: any): string {
    if (!persona) {
      return 'Sin información';
    }

    const nombreCompleto = persona.nombreCompleto || '';
    if (nombreCompleto) {
      return nombreCompleto;
    }

    const nombres = persona.nombres || '';
    const apellidoPaterno = persona.apellidoPaterno || '';
    const apellidoMaterno = persona.apellidoMaterno || '';

    return `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`.trim() || 'Sin nombre';
  }

  calcularDiferencia(fechaSalida: string, fechaJornal: string): string {
    const salidaDate = new Date(fechaSalida);
    if (Number.isNaN(salidaDate.getTime())) {
      return '';
    }

    const baseDate = fechaJornal ? new Date(`${fechaJornal}T19:00:00`) : new Date(salidaDate);
    if (Number.isNaN(baseDate.getTime())) {
      return '';
    }

    const diffMs = salidaDate.getTime() - baseDate.getTime();
    const sign = diffMs < 0 ? '-' : '';
    const diffAbs = Math.abs(diffMs);

    const hours = Math.floor(diffAbs / 3600000);
    const minutes = Math.floor((diffAbs % 3600000) / 60000);
    const seconds = Math.floor((diffAbs % 60000) / 1000);

    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  generarReporteSunafil() {
    if (!this.datos.length) {
      alert('No hay datos para generar el reporte.');
      return;
    }

    const columnas = [
      { key: 'sedeProyecto', label: 'SEDE/PROYECTO' },
      { key: 'empleado', label: 'EMPLEADO' },
      { key: 'doc', label: 'DOC' },
      { key: 'fecha', label: 'FECHA' },
      { key: 'iprog', label: 'IProg' },
      { key: 'ingreso', label: 'Ingreso' },
      { key: 'sprod', label: 'SProd' },
      { key: 'salida', label: 'Salida' },
      { key: 'diferencia', label: 'Diferencia' }
    ] as const;

    const filas = [...this.datos].sort((a, b) => {
      const empleadoCompare = a.empleado.localeCompare(b.empleado, 'es', { sensitivity: 'base' });
      if (empleadoCompare !== 0) {
        return empleadoCompare;
      }

      return a.fecha.localeCompare(b.fecha);
    });

    const tablaHtml = filas
      .map(row => {
        const celdas = columnas
          .map(columna => `<td>${this.escapeHtml(String(row[columna.key] ?? ''))}</td>`)
          .join('');
        return `<tr>${celdas}</tr>`;
      })
      .join('');

    const html = `
      <html>
        <head>
          <title>Reporte General de Marcaciones</title>
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 24px;
              color: #1f2937;
            }
            .header {
              text-align: center;
              margin-bottom: 18px;
            }
            .header h1 {
              font-size: 18px;
              margin: 0 0 4px;
              letter-spacing: 0.5px;
            }
            .header h2 {
              font-size: 14px;
              margin: 0;
              font-weight: normal;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 6px 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #f3f4f6;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.4px;
            }
            @media print {
              body {
                margin: 12px;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>REPORTE GENERAL DE MARCACIONES</h1>
            <h2>CONVEYOR BELT TECHNOLOGY S.A.C. - RUC : 20454826699</h2>
          </div>
          <table>
            <thead>
              <tr>
                ${columnas.map(columna => `<th>${columna.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tablaHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const ventana = window.open('', '_blank');
    if (!ventana) {
      alert('No se pudo abrir la ventana de impresión.');
      return;
    }

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  }

  private escapeHtml(text: string): string {
    const mapa: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => mapa[m]);
  }
}
