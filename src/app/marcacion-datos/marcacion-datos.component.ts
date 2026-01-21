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

    this.datos = Array.from(datosMap.values());
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
}
