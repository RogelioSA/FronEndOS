import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface EntidadFinanciera {
  id: number;
  nombre: string;
  nombreCorto: string;
  activo: boolean;
}

@Component({
  selector: 'app-entidadfinanciera',
  standalone: false,
  templateUrl: './entidadfinanciera.component.html',
  styleUrl: './entidadfinanciera.component.css'
})
export class EntidadfinancieraComponent implements OnInit{

  @BlockUI() blockUI!: NgBlockUI;
  
  entidades: EntidadFinanciera[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      const response = await firstValueFrom(
        this.apiService.listarEntidadesFinancierasActivas()
      );
      this.entidades = response;
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
        nombre: event.data.nombre,
        nombreCorto: event.data.nombreCorto,
        activo: event.data.activo !== undefined ? event.data.activo : true
      };

      await firstValueFrom(
        this.apiService.crearEntidadFinanciera(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Entidad financiera creada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear la entidad financiera', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        nombre: event.newData.nombre ?? event.oldData.nombre,
        nombreCorto: event.newData.nombreCorto ?? event.oldData.nombreCorto,
        activo: event.newData.activo ?? event.oldData.activo
      };

      await firstValueFrom(
        this.apiService.editarEntidadFinanciera(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Entidad financiera actualizada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar la entidad financiera', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarEntidadFinanciera(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Entidad financiera eliminada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar la entidad financiera', 'error');
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
