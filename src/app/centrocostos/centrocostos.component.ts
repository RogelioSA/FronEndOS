import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface CentroCostos {
  id: number;
  empresaId: number;
  nombre: string;
  nombreCorto: string;
  codigo: string;
  esFinal: boolean;
  activo: boolean;
  padreId: number | null;
}

@Component({
  selector: 'app-centrocostos',
  standalone: false,
  templateUrl: './centrocostos.component.html',
  styleUrl: './centrocostos.component.css'
})
export class CentrocostosComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  centros: CentroCostos[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      const response = await firstValueFrom(
        this.apiService.listarCentrosDeCostosActivos()
      );
      this.centros = response;
      this.blockUI.stop();
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al cargar los datos', 'error');
      console.error('Error:', error);
    }
  }

  async insertar(event: any): Promise<void> {
    try {
      this.blockUI.start('Guardando...');
      
      const nuevoRegistro = {
        empresaId: event.data.empresaId || 1,
        nombre: event.data.nombre,
        nombreCorto: event.data.nombreCorto,
        codigo: event.data.codigo || '',
        esFinal: event.data.esFinal !== undefined ? event.data.esFinal : true,
        activo: event.data.activo !== undefined ? event.data.activo : true,
        padreId: event.data.padreId || null
      };

      await firstValueFrom(
        this.apiService.crearCentroDeCostos(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Centro de costos creado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear el centro de costos', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        empresaId: event.newData.empresaId ?? event.oldData.empresaId,
        nombre: event.newData.nombre ?? event.oldData.nombre,
        nombreCorto: event.newData.nombreCorto ?? event.oldData.nombreCorto,
        codigo: event.newData.codigo ?? event.oldData.codigo,
        esFinal: event.newData.esFinal ?? event.oldData.esFinal,
        activo: event.newData.activo ?? event.oldData.activo,
        padreId: event.newData.padreId ?? event.oldData.padreId
      };

      await firstValueFrom(
        this.apiService.editarCentroDeCostos(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Centro de costos actualizado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar el centro de costos', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarCentroDeCostos(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Centro de costos eliminado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar el centro de costos', 'error');
      console.error('Error:', error);
    }
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
      messageBox.textContent = mensaje;
      messageBox.style.display = 'block';
      messageBox.style.backgroundColor = tipo === 'success' ? '#d4edda' : '#f8d7da';
      messageBox.style.color = tipo === 'success' ? '#155724' : '#721c24';
      
      setTimeout(() => {
        messageBox.style.display = 'none';
      }, 3000);
    }
  }
}