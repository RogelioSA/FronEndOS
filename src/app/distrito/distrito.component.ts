import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
interface Distrito {
  id: number;
  nombre: string;
  provinciaId: number;
  provincia?: any;
}

interface Provincia {
  id: number;
  nombre: string;
  departamentoId: number;
}

@Component({
  selector: 'app-distrito',
  standalone: false,
  templateUrl: './distrito.component.html',
  styleUrl: './distrito.component.css'
})
export class DistritoComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  distritos: Distrito[] = [];
  provincias: Provincia[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      
      // Cargar provincias para el lookup
      const provinciasResponse = await firstValueFrom(
        this.apiService.listarProvincias()
      );
      this.provincias = provinciasResponse;
      
      // Cargar distritos
      const distritosResponse = await firstValueFrom(
        this.apiService.getDistritos()
      );
      this.distritos = distritosResponse;
      
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
        provinciaId: event.data.provinciaId
      };

      await firstValueFrom(
        this.apiService.crearDistrito(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Distrito creado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear el distrito', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        nombre: event.newData.nombre ?? event.oldData.nombre,
        provinciaId: event.newData.provinciaId ?? event.oldData.provinciaId
      };

      await firstValueFrom(
        this.apiService.editarDistrito(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Distrito actualizado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar el distrito', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarDistrito(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Distrito eliminado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar el distrito', 'error');
      console.error('Error:', error);
    }
  }

  calculateNombreProvincia = (rowData: any) => {
    const provincia = this.provincias.find(p => p.id === rowData.provinciaId);
    return provincia ? provincia.nombre : '';
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