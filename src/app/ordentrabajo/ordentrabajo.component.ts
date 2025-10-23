import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface OrdenTrabajoCabecera {
  id?: number;
  empresaId: number;
  ordenServicioCabeceraId: number;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaCompromiso: string;
  fechaFin: string | null;
  grupoTrabajoId: number;
  ordenTrabajoCabeceraPadreId: number | null;
  estado: number;
}

@Component({
  selector: 'app-ordentrabajo',
  standalone: false,
  templateUrl: './ordentrabajo.component.html',
  styleUrl: './ordentrabajo.component.css'
})
export class OrdentrabajoComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;

  ordenesTrabajo: any[] = [];
  ordenesServicio: any[] = [];
  gruposTrabajo: any[] = [];

  // EmpresaId por defecto (ajústalo según tu aplicación)
  private readonly DEFAULT_EMPRESA_ID = 1;

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    try {
      this.blockUI.start('Cargando datos...');

      // Cargar órdenes de trabajo
      const ordenesTrabajoResponse = await firstValueFrom(
        this.apiService.listarOrdenTrabajoCabecera()
      );
      this.ordenesTrabajo = ordenesTrabajoResponse;

      // Cargar órdenes de servicio para el lookup
      const ordenesServicioResponse = await firstValueFrom(
        this.apiService.listarOrdenServicioCabecera()
      );
      this.ordenesServicio = ordenesServicioResponse;

      // Cargar grupos de trabajo
      const gruposResponse = await firstValueFrom(
        this.apiService.getGruposTrabajo()
      );
      this.gruposTrabajo = gruposResponse;

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al cargar los datos', 'error');
    }
  }

  construirPayload(rowData: any): OrdenTrabajoCabecera {
    return {
      empresaId: rowData.empresaId || this.DEFAULT_EMPRESA_ID,
      ordenServicioCabeceraId: rowData.ordenServicioCabeceraId,
      nombre: rowData.nombre,
      descripcion: rowData.descripcion || '',
      fechaInicio: rowData.fechaInicio,
      fechaCompromiso: rowData.fechaCompromiso,
      fechaFin: rowData.fechaFin || null,
      grupoTrabajoId: rowData.grupoTrabajoId,
      ordenTrabajoCabeceraPadreId: rowData.ordenTrabajoCabeceraPadreId || null,
      estado: rowData.estado !== undefined ? rowData.estado : 0
    };
  }

  async insertarOrdenTrabajo(e: any) {
    try {
      this.blockUI.start('Guardando...');

      const payload = this.construirPayload(e.data);

      await firstValueFrom(
        this.apiService.crearOrdenTrabajoCabecera(payload)
      );

      this.mostrarMensaje('Orden de trabajo creada exitosamente', 'success');
      await this.cargarDatos();

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al insertar:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al guardar la orden de trabajo', 'error');
      e.cancel = true;
    }
  }

  async actualizarOrdenTrabajo(e: any) {
    try {
      this.blockUI.start('Actualizando...');

      const rowData = { ...e.oldData, ...e.newData };
      const payload = this.construirPayload(rowData);

      await firstValueFrom(
        this.apiService.editarOrdenTrabajoCabecera(e.key, payload)
      );

      this.mostrarMensaje('Orden de trabajo actualizada exitosamente', 'success');
      await this.cargarDatos();

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al actualizar:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar la orden de trabajo', 'error');
      e.cancel = true;
    }
  }

  async eliminarOrdenTrabajo(e: any) {
    try {
      this.blockUI.start('Eliminando...');

      await firstValueFrom(
        this.apiService.eliminarOrdenTrabajoCabecera(e.key)
      );

      this.mostrarMensaje('Orden de trabajo eliminada exitosamente', 'success');
      await this.cargarDatos();

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al eliminar:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar la orden de trabajo', 'error');
      e.cancel = true;
    }
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error') {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
      messageBox.textContent = mensaje;
      messageBox.style.display = 'block';
      messageBox.style.backgroundColor = tipo === 'success' ? '#d4edda' : '#f8d7da';
      messageBox.style.color = tipo === 'success' ? '#155724' : '#721c24';
      messageBox.style.border = `1px solid ${tipo === 'success' ? '#c3e6cb' : '#f5c6cb'}`;

      setTimeout(() => {
        if (messageBox) {
          messageBox.style.display = 'none';
        }
      }, 3000);
    }
  }
}