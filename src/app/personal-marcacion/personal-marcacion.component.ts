import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

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

  registrosAsistencia: RegistroAsistencia[] = [];
  personalId: number = 0;
  fechaInicio: string = '';
  fechaFin: string = '';
  mesActual: string = '';
  
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
    this.obtenerPersonalId();
    this.calcularFechasMes();
    await this.cargarRegistros();
  }

  obtenerPersonalId() {
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
      console.error('❌ No se encontró user_id en localStorage');
      alert('No se pudo obtener el ID del usuario');
      return;
    }

    this.personalId = parseInt(userId, 10);
    
    if (isNaN(this.personalId)) {
      console.error('❌ user_id no es un número válido');
      alert('ID de usuario inválido');
      return;
    }

    console.log('✅ Personal ID obtenido:', this.personalId);
  }

  calcularFechasMes() {
    const ahora = new Date();
    const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
    
    this.fechaInicio = this.formatearFechaISO(primerDia);
    this.fechaFin = this.formatearFechaISO(ultimoDia);
    
    this.mesActual = ahora.toLocaleDateString('es-ES', { 
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
    if (!this.personalId) {
      console.error('❌ No hay personalId para cargar registros');
      return;
    }

    try {
      this.blockUI.start('Cargando registros de asistencia...');

      const response = await firstValueFrom(
        this.apiService.getRegistroAsistenciaPersonal(
          this.personalId,
          this.fechaInicio,
          this.fechaFin
        )
      );

      console.log('✅ Registros de asistencia obtenidos:', response);
      
      this.registrosAsistencia = response;
      this.calcularEstadisticas();

      this.blockUI.stop();
    } catch (error) {
      console.error('❌ Error al cargar registros:', error);
      this.blockUI.stop();
      alert('Error al cargar los registros de asistencia');
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
    const fechaActual = new Date(this.fechaInicio);
    fechaActual.setMonth(fechaActual.getMonth() + direccion);
    
    const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
    
    this.fechaInicio = this.formatearFechaISO(primerDia);
    this.fechaFin = this.formatearFechaISO(ultimoDia);
    
    this.mesActual = fechaActual.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
    
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

  calcularHoraProgramada = (rowData: any): string => {
    return rowData.horarioDetalleEvento?.hora || 'N/A';
  }
}