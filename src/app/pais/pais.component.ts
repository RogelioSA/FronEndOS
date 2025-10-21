import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface Pais {
  id: number;
  nombre: string;
  codigoIso: string;
  codigoTelefono: string;
  departamentos?: any;
}

@Component({
  selector: 'app-pais',
  standalone: false,
  templateUrl: './pais.component.html',
  styleUrl: './pais.component.css'
})
export class PaisComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  paises: Pais[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      const response = await firstValueFrom(
        this.apiService.listarPaises()
      );
      this.paises = response;
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
        codigoIso: event.data.codigoIso,
        codigoTelefono: event.data.codigoTelefono
      };

      await firstValueFrom(
        this.apiService.crearPais(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('País creado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear el país', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        nombre: event.newData.nombre ?? event.oldData.nombre,
        codigoIso: event.newData.codigoIso ?? event.oldData.codigoIso,
        codigoTelefono: event.newData.codigoTelefono ?? event.oldData.codigoTelefono
      };

      await firstValueFrom(
        this.apiService.editarPais(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('País actualizado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar el país', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarPais(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('País eliminado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar el país', 'error');
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