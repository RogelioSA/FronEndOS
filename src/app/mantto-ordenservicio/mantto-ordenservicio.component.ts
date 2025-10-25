import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
  selector: 'app-mantto-ordenservicio',
  standalone: false,
  templateUrl: './mantto-ordenservicio.component.html',
  styleUrl: './mantto-ordenservicio.component.css'
})
export class ManttoOrdenservicioComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;

  ordenes: any[] = [];
  ordenesServicioTipo: any[] = [];

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    try {
      this.blockUI.start('Cargando datos...');

      // Cargar órdenes de servicio
      const ordenesResponse = await firstValueFrom(
        this.apiService.listarOrdenServicioCabecera()
      );
      this.ordenes = ordenesResponse;

      // Cargar tipos de orden
      const tiposResponse = await firstValueFrom(
        this.apiService.getOrdenesServicioTipo()
      );
      this.ordenesServicioTipo = tiposResponse;

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al cargar los datos', 'error');
    }
  }

  construirPayload(rowData: any): any {
    return {
      empresaId: rowData.empresaId || 1,
      ordenServicioTipoId: rowData.ordenServicioTipoId,
      codigoOrdenInterna: rowData.codigoOrdenInterna,
      codigoReferencial: rowData.codigoReferencial || '',
      descripcion: rowData.descripcion,
      activo: rowData.activo !== undefined ? rowData.activo : true,
      fechaInicial: rowData.fechaInicial,
      fechaFinal: rowData.fechaFinal,
      fechaEntrega: rowData.fechaEntrega
    };
  }

  async insertar(e: any) {
    try {
      this.blockUI.start('Guardando...');
      
      const payload = this.construirPayload(e.data);
      
      await firstValueFrom(
        this.apiService.crearOrdenServicioCabecera(payload)
      );

      this.mostrarMensaje('Orden de servicio registrada exitosamente', 'success');
      await this.cargarDatos();
      
      this.blockUI.stop();
    } catch (error) {
      console.error('Error al insertar:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al guardar la orden de servicio', 'error');
      e.cancel = true;
    }
  }

  async actualizar(e: any) {
    try {
      this.blockUI.start('Actualizando...');
      
      const rowData = { ...e.oldData, ...e.newData };
      const payload = this.construirPayload(rowData);
      
      await firstValueFrom(
        this.apiService.editarOrdenServicioCabecera(e.key, payload)
      );

      this.mostrarMensaje('Orden de servicio actualizada exitosamente', 'success');
      await this.cargarDatos();
      
      this.blockUI.stop();
    } catch (error) {
      console.error('Error al actualizar:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar la orden de servicio', 'error');
      e.cancel = true;
    }
  }

  async eliminar(e: any) {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarOrdenServicioCabecera(e.key)
      );

      this.mostrarMensaje('Orden de servicio eliminada exitosamente', 'success');
      await this.cargarDatos();
      
      this.blockUI.stop();
    } catch (error) {
      console.error('Error al eliminar:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar la orden de servicio', 'error');
      e.cancel = true;
    }
  }

  calculateNombreTipoOrden = (rowData: any) => {
    const tipo = this.ordenesServicioTipo.find(t => t.id === rowData.ordenServicioTipoId);
    return tipo ? tipo.nombre : '';
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