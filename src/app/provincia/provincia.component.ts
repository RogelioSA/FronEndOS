import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface Provincia {
  id: number;
  nombre: string;
  departamentoId: number;
  departamento?: any;
  distritos?: any;
}

interface Departamento {
  id: number;
  nombre: string;
  paisId: number;
}

@Component({
  selector: 'app-provincia',
  standalone: false,
  templateUrl: './provincia.component.html',
  styleUrl: './provincia.component.css'
})
export class ProvinciaComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  provincias: Provincia[] = [];
  departamentos: Departamento[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      
      // Cargar departamentos para el lookup
      const departamentosResponse = await firstValueFrom(
        this.apiService.getDepartamentos()
      );
      this.departamentos = departamentosResponse;
      
      // Cargar provincias
      const provinciasResponse = await firstValueFrom(
        this.apiService.listarProvincias()
      );
      this.provincias = provinciasResponse;
      
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
        departamentoId: event.data.departamentoId
      };

      await firstValueFrom(
        this.apiService.crearProvincia(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Provincia creada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear la provincia', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        nombre: event.newData.nombre ?? event.oldData.nombre,
        departamentoId: event.newData.departamentoId ?? event.oldData.departamentoId
      };

      await firstValueFrom(
        this.apiService.editarProvincia(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Provincia actualizada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar la provincia', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarProvincia(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Provincia eliminada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar la provincia', 'error');
      console.error('Error:', error);
    }
  }

  calculateNombreDepartamento = (rowData: any) => {
    const departamento = this.departamentos.find(d => d.id === rowData.departamentoId);
    return departamento ? departamento.nombre : '';
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