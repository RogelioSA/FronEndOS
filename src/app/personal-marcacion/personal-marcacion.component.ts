import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DxDataGridComponent } from 'devextreme-angular';

// Declarar Leaflet para TypeScript
declare var L: any;

interface RegistroAsistencia {
  empresaId: number;
  id: number;
  personalId: number;
  fecha: string;
  fechaJornal: string;
  tipoEvento: number;
  esTardanza: boolean;
  diferenciaMinutos: number;
  latitud: number | null;
  longitud: number | null;
  horarioDetalleEventoId: number;
  registroAsistenciaPoliticaId: number;
  horarioDetalleEvento: {
    hora: string;
    tipoEvento: number;
  };
}

@Component({
  selector: 'app-personal-marcacion',
  standalone: false,
  templateUrl: './personal-marcacion.component.html',
  styleUrl: './personal-marcacion.component.css'
})
export class PersonalMarcacionComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  @ViewChild(DxDataGridComponent) dataGrid?: DxDataGridComponent;

  registrosAsistencia: RegistroAsistencia[] = [];
  usuarioId: string = '0';
  fechaInicio: string = '';
  fechaFin: string = '';
  mesActual: string = '';
  cargando: boolean = false;
  private periodoActual: Date = new Date();
  
  // Variables para estadísticas
  totalRegistros: number = 0;
  registrosEntrada: number = 0;
  registrosSalida: number = 0;
  totalTardanzas: number = 0;
  minutosAcumulados: number = 0;

  // Variables para el mapa
  mostrarModalMapa: boolean = false;
  coordenadasSeleccionadas: { latitud: number | null, longitud: number | null } = { 
    latitud: null, 
    longitud: null 
  };
  map: any = null;

  // Lookup para tipo de evento
  tiposEvento = [
    { value: 0, text: 'Entrada', icon: 'bi-box-arrow-in-right', color: 'success' },
    { value: 1, text: 'Salida', icon: 'bi-box-arrow-right', color: 'danger' },
    { value: 2, text: 'Refrigerio Inicio', icon: 'bi-cup-hot', color: 'info' },
    { value: 3, text: 'Refrigerio Fin', icon: 'bi-cup-hot-fill', color: 'info' }
  ];

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    this.calcularFechasMes();
    await this.cargarRegistros();
  }

  obtenerUsuarioId() { // Renombrado y simplificado
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
      console.error('❌ No se encontró user_id en localStorage');
      alert('No se pudo obtener el ID del usuario');
      return;
    }

    this.usuarioId = userId; // Ya no se parsea a número
    console.log('✅ Usuario ID obtenido:', this.usuarioId);
  }

  calcularFechasMes() {
    const ahora = new Date();
    this.periodoActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    this.actualizarPeriodoSeleccionado();
  }

  private actualizarPeriodoSeleccionado() {
    const year = this.periodoActual.getFullYear();
    const month = this.periodoActual.getMonth();

    this.fechaInicio = this.formatearFechaISO(new Date(year, month, 1));
    this.fechaFin = this.formatearFechaISO(new Date(year, month + 1, 0));
    this.mesActual = this.periodoActual.toLocaleDateString('es-ES', {
      month: 'long', 
      year: 'numeric' 
    });
  }

  formatearFechaISO(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async cargarRegistros() {
    if (!this.usuarioId) { // Cambiado de personalId
      console.error('❌ No hay usuarioId para cargar registros');
      return;
    }

    try {
      this.cargando = true;
      this.blockUI.start('Cargando registros de asistencia...');

      const response = await firstValueFrom(
        this.apiService.getRegistroAsistenciaPersonal(
          this.usuarioId, // Cambiado de this.personalId
          this.fechaInicio,
          this.fechaFin
        )
      );

      console.log('✅ Registros de asistencia obtenidos:', response);
      
      this.registrosAsistencia = Array.isArray(response) ? response : [];
      this.calcularEstadisticas();
    } catch (error) {
      console.error('❌ Error al cargar registros:', error);
      alert('Error al cargar los registros de asistencia');
    } finally {
      this.cargando = false;
      this.blockUI.stop();
    }
  }
  calcularEstadisticas() {
    this.totalRegistros = this.registrosAsistencia.length;
    
    this.registrosEntrada = this.registrosAsistencia.filter(
      r => r.tipoEvento === 0
    ).length;
    
    this.registrosSalida = this.registrosAsistencia.filter(
      r => r.tipoEvento === 1
    ).length;

    this.totalTardanzas = this.registrosAsistencia.filter(
      r => r.esTardanza
    ).length;

    this.minutosAcumulados = this.registrosAsistencia
      .filter(r => r.esTardanza)
      .reduce((sum, r) => sum + r.diferenciaMinutos, 0);
  }

  async cambiarMes(direccion: number) {
    if (this.cargando || !Number.isInteger(direccion) || direccion === 0) return;

    this.periodoActual = new Date(
      this.periodoActual.getFullYear(),
      this.periodoActual.getMonth() + direccion,
      1
    );
    this.actualizarPeriodoSeleccionado();
    await this.cargarRegistros();
  }

  async actualizarMarcaciones() {
    if (this.cargando) return;

    this.registrosAsistencia = [];
    this.calcularEstadisticas();
    this.dataGrid?.instance.clearFilter();
    this.dataGrid?.instance.searchByText('');
    this.dataGrid?.instance.pageIndex(0);
    await this.cargarRegistros();
  }

  formatearFechaHora = (cellInfo: any): string => {
    if (!cellInfo.value) return 'N/A';
    const date = new Date(cellInfo.value);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatearSoloFecha = (cellInfo: any): string => {
    if (!cellInfo.value) return 'N/A';
    const date = new Date(cellInfo.value);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  obtenerNombreTipoEvento(tipoEvento: number): string {
    const tipo = this.tiposEvento.find(t => t.value === tipoEvento);
    return tipo ? tipo.text : 'Desconocido';
  }

  obtenerColorTipoEvento(tipoEvento: number): string {
    const tipo = this.tiposEvento.find(t => t.value === tipoEvento);
    return tipo ? tipo.color : 'secondary';
  }

  mostrarMapa = (e: any) => {
    const rowData = e.row.data;
    
    if (!rowData.latitud || !rowData.longitud) {
      alert('No hay coordenadas disponibles para este registro');
      return;
    }

    this.coordenadasSeleccionadas = {
      latitud: rowData.latitud,
      longitud: rowData.longitud
    };

    this.mostrarModalMapa = true;

    setTimeout(() => {
      this.inicializarMapa();
    }, 100);
  }

  inicializarMapa() {
    const lat = this.coordenadasSeleccionadas.latitud;
    const lng = this.coordenadasSeleccionadas.longitud;

    if (!lat || !lng) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('map').setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(`<b>Ubicación de marcación</b><br>Lat: ${lat}<br>Lng: ${lng}`)
      .openPopup();
  }

  cerrarMapa() {
    this.mostrarModalMapa = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  calcularCellValue = (rowData: any) => {
    return this.obtenerNombreTipoEvento(rowData.tipoEvento);
  }
}
