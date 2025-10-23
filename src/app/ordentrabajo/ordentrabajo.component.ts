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
  fechaFin: string;
  grupoTrabajoId: number;
  ordenTrabajoCabeceraPadreId: number | null;
  estado: number;
  detalles?: any[];
  personas?: any[];
}

interface OrdenTrabajoDetalle {
  id: number;
  empresaId: number;
  ubicacionTecnicaId: number;
  laborId: number;
  horasProyectadas: number;
  horasEjecutadas: number;
  descripcion: string;
  estado: number;
  activoId: number;
}

@Component({
  selector: 'app-ordentrabajo',
  standalone: false,
  templateUrl: './ordentrabajo.component.html',
  styleUrl: './ordentrabajo.component.css'
})
export class OrdentrabajoComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;

  ordenes: any[] = [];
  ordenesServicio: any[] = [];
  gruposTrabajo: any[] = [];

  // Valores por defecto configurables
  private readonly DEFAULT_UBICACION_TECNICA_ID = 1;
  private readonly DEFAULT_LABOR_ID = 1;
  private readonly DEFAULT_ACTIVO_ID = 1;
  private readonly DEFAULT_PERSONA_ID = 1;

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    try {
      this.blockUI.start('Cargando datos...');

      // Cargar órdenes de trabajo
      const ordenesResponse = await firstValueFrom(
        this.apiService.getOrdenesTrabajoMantenimientoExterno()
      );

      // Cargar órdenes de servicio para el lookup
      const ordenesServicioResponse = await firstValueFrom(
        this.apiService.getOrdenesServicioMantenimientoExterno()
      );
      this.ordenesServicio = ordenesServicioResponse.map((os: any) => ({
        id: os.id,
        nombre: os.codigoOrdenInterna || os.descripcion || `Orden ${os.id}`
      }));

      // Cargar grupos de trabajo
      const gruposResponse = await firstValueFrom(
        this.apiService.getGruposTrabajo()
      );
      this.gruposTrabajo = gruposResponse;

      // Transformar las órdenes
      this.ordenes = this.transformarOrdenes(ordenesResponse);

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al cargar los datos', 'error');
    }
  }

  transformarOrdenes(ordenes: any[]): any[] {
    return ordenes.map(orden => ({
      id: orden.id,
      empresaId: orden.empresaId,
      ordenServicioCabeceraId: orden.ordenServicioCabeceraId,
      nombre: orden.nombre,
      descripcion: orden.descripcion,
      fechaInicio: orden.fechaInicio,
      fechaCompromiso: orden.fechaCompromiso,
      fechaFin: orden.fechaFin,
      grupoTrabajoId: orden.grupoTrabajoId,
      ordenTrabajoCabeceraPadreId: orden.ordenTrabajoCabeceraPadreId,
      estado: orden.estado,
      // Guardar detalles y personas originales para la actualización
      _detalles: orden.detalles || [],
      _personas: orden.personas || []
    }));
  }

  construirPayload(rowData: any): any {
    // Si no hay detalles, crear uno por defecto
    const detalles = rowData._detalles && rowData._detalles.length > 0 
      ? rowData._detalles 
      : [
          {
            detalle: {
              id: 0,
              empresaId: rowData.empresaId || 0,
              ubicacionTecnicaId: this.DEFAULT_UBICACION_TECNICA_ID,
              laborId: this.DEFAULT_LABOR_ID,
              horasProyectadas: 0,
              horasEjecutadas: 0,
              descripcion: rowData.descripcion || 'Sin descripción',
              estado: 0
            },
            activo: {
              id: 0,
              empresaId: rowData.empresaId || 0,
              activoId: this.DEFAULT_ACTIVO_ID
            }
          }
        ];

    // Si no hay personas, crear una por defecto
    const personas = rowData._personas && rowData._personas.length > 0
      ? rowData._personas
      : [
          {
            id: 0,
            empresaId: rowData.empresaId || 0,
            personaId: this.DEFAULT_PERSONA_ID,
            esLider: true
          }
        ];

    return {
      cabecera: {
        empresaId: rowData.empresaId || 0,
        ordenServicioCabeceraId: rowData.ordenServicioCabeceraId || 0,
        nombre: rowData.nombre || '',
        descripcion: rowData.descripcion || '',
        fechaInicio: rowData.fechaInicio || new Date().toISOString(),
        fechaCompromiso: rowData.fechaCompromiso || new Date().toISOString(),
        fechaFin: rowData.fechaFin || null,
        grupoTrabajoId: rowData.grupoTrabajoId || 0,
        ordenTrabajoCabeceraPadreId: rowData.ordenTrabajoCabeceraPadreId || null,
        estado: rowData.estado !== undefined ? rowData.estado : 0
      },
      detalles: detalles,
      personas: personas
    };
  }

  async insertarTipo(e: any) {
    try {
      this.blockUI.start('Guardando...');

      const payload = this.construirPayload(e.data);

      await firstValueFrom(
        this.apiService.crearOrdenTrabajoMantenimientoExterno(payload)
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

  async actualizarTipo(e: any) {
    try {
      this.blockUI.start('Actualizando...');

      const rowData = { ...e.oldData, ...e.newData };
      const payload = this.construirPayload(rowData);

      await firstValueFrom(
        this.apiService.actualizarOrdenTrabajoMantenimientoExterno(e.key, payload)
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

  async eliminarTipo(e: any) {
    try {
      this.blockUI.start('Eliminando...');

      await firstValueFrom(
        this.apiService.eliminarOrdenTrabajoMantenimientoExterno(e.key)
      );

      this.mostrarMensaje('Orden de trabajo eliminada exitosamente', 'success');

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