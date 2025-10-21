import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface DocumentoTipo {
  id: number;
  nombre: string;
  nombreCorto: string;
  codigoEstatal: string;
}

@Component({
  selector: 'app-documentotipo',
  standalone: false,
  templateUrl: './documentotipo.component.html',
  styleUrl: './documentotipo.component.css'
})
export class DocumentotipoComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  documentosTipo: DocumentoTipo[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      const response = await firstValueFrom(
        this.apiService.getDocumentoTipo()
      );
      this.documentosTipo = response;
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
        codigoEstatal: event.data.codigoEstatal || ''
      };

      await firstValueFrom(
        this.apiService.crearDocumentoTipo(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Tipo de documento creado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear el tipo de documento', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        nombre: event.newData.nombre ?? event.oldData.nombre,
        nombreCorto: event.newData.nombreCorto ?? event.oldData.nombreCorto,
        codigoEstatal: event.newData.codigoEstatal ?? event.oldData.codigoEstatal
      };

      await firstValueFrom(
        this.apiService.editarDocumentoTipo(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Tipo de documento actualizado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar el tipo de documento', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarDocumentoTipo(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Tipo de documento eliminado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar el tipo de documento', 'error');
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