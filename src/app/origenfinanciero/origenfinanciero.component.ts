import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface OrigenFinanciero {
  id: number;
  nombre: string;
  nombreCorto: string;
  naturaleza: string;
  activo: boolean;
}

@Component({
  selector: 'app-origenfinanciero',
  standalone: false,
  templateUrl: './origenfinanciero.component.html',
  styleUrl: './origenfinanciero.component.css'
})
export class OrigenfinancieroComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  origenesFinancieros: OrigenFinanciero[] = [];
  opcionesNaturaleza: any[] = [
    { valor: 'D', texto: 'Débito' },
    { valor: 'C', texto: 'Crédito' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      const response = await firstValueFrom(
        this.apiService.listarOrigenFinancieroActivos()
      );
      this.origenesFinancieros = response;
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
        naturaleza: event.data.naturaleza || 'D',
        activo: event.data.activo !== undefined ? event.data.activo : true
      };

      await firstValueFrom(
        this.apiService.crearOrigenFinanciero(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Origen financiero creado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear el origen financiero', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        nombre: event.newData.nombre ?? event.oldData.nombre,
        nombreCorto: event.newData.nombreCorto ?? event.oldData.nombreCorto,
        naturaleza: event.newData.naturaleza ?? event.oldData.naturaleza,
        activo: event.newData.activo ?? event.oldData.activo
      };

      await firstValueFrom(
        this.apiService.editarOrigenFinanciero(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Origen financiero actualizado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar el origen financiero', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarOrigenFinanciero(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Origen financiero eliminado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar el origen financiero', 'error');
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