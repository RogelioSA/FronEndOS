import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface Sexo {
  id: number;
  nombre: string;
  nombreCorto: string;
}

@Component({
  selector: 'app-sexo',
  standalone: false,
  templateUrl: './sexo.component.html',
  styleUrl: './sexo.component.css'
})
export class SexoComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  sexos: Sexo[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      const response = await firstValueFrom(
        this.apiService.getSexo()
      );
      this.sexos = response;
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
        nombreCorto: event.data.nombreCorto
      };

      await firstValueFrom(
        this.apiService.crearSexo(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Sexo creado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear el sexo', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        nombre: event.newData.nombre ?? event.oldData.nombre,
        nombreCorto: event.newData.nombreCorto ?? event.oldData.nombreCorto
      };

      await firstValueFrom(
        this.apiService.editarSexo(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Sexo actualizado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar el sexo', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarSexo(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Sexo eliminado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar el sexo', 'error');
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