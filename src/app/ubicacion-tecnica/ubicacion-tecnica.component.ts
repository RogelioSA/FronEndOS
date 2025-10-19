import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface UbicacionTecnica {
  id: number;
  empresaId: number;
  nombre: string;
  activo: boolean;
  terceroId: number;
  padreId: number | null;
  tercero?: any;
  padre?: any;
}

interface Tercero {
  id: number;
  razonSocial: string;
  documentoIdentidadFinanciero: string;
}

@Component({
  selector: 'app-ubicacion-tecnica',
  standalone: false,
  templateUrl: './ubicacion-tecnica.component.html',
  styleUrl: './ubicacion-tecnica.component.css'
})
export class UbicacionTecnicaComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  ubicacion: UbicacionTecnica[] = [];
  terceros: Tercero[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      
      // Cargar terceros primero
      const tercerosResponse = await firstValueFrom(
        this.apiService.getClientes()
      );
      this.terceros = tercerosResponse;
      
      // Luego cargar ubicaciones técnicas
      const ubicacionesResponse = await firstValueFrom(
        this.apiService.getUbicacionesTecnicasActivas()
      );
      this.ubicacion = ubicacionesResponse;
      
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
        activo: event.data.activo !== undefined ? event.data.activo : true,
        terceroId: event.data.terceroId,
        padreId: event.data.padreId || null
      };

      await firstValueFrom(
        this.apiService.registrarUbicacionTecnica(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Registro creado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear el registro', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        empresaId: event.newData.empresaId ?? event.oldData.empresaId,
        nombre: event.newData.nombre ?? event.oldData.nombre,
        activo: event.newData.activo ?? event.oldData.activo,
        terceroId: event.newData.terceroId ?? event.oldData.terceroId,
        padreId: event.newData.padreId ?? event.oldData.padreId
      };

      await firstValueFrom(
        this.apiService.actualizarUbicacionTecnica(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Registro actualizado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar el registro', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarUbicacionTecnica(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Registro eliminado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar el registro', 'error');
      console.error('Error:', error);
    }
  }

  // Función para obtener la razón social del tercero por ID
  obtenerRazonSocialTercero(terceroId: number): string {
    const tercero = this.terceros.find(t => t.id === terceroId);
    return tercero ? tercero.razonSocial : 'No encontrado';
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

  calculateRazonSocialTercero = (rowData: any) => {
    const tercero = this.terceros.find(t => t.id === rowData.terceroId);
    return tercero ? tercero.razonSocial : 'No encontrado';
  }
}