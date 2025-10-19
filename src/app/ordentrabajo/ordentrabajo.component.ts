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
  
  ordenes: OrdenTrabajoCabecera[] = [];
  detalles: OrdenTrabajoDetalle[] = [];
  ordenSeleccionada: OrdenTrabajoCabecera | null = null;
  filasSeleccionadasOrden: number[] = [];
  activarAgregarDetalles: boolean = false;
  
  // Catálogos para lookups
  ordenesServicio: any[] = [];
  gruposTrabajo: any[] = [];
  ubicacionesTecnicas: any[] = [];
  labores: any[] = [];
  activos: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      
      // Cargar catálogos
      await this.cargarCatalogos();
      
      // Cargar órdenes de trabajo
      const ordenesResponse = await firstValueFrom(
        this.apiService.getOrdenesTrabajoMantenimientoExterno()
      );
      
      this.ordenes = ordenesResponse.map((orden: any) => ({
        id: orden.cabecera.id,
        empresaId: orden.cabecera.empresaId,
        ordenServicioCabeceraId: orden.cabecera.ordenServicioCabeceraId,
        nombre: orden.cabecera.nombre,
        descripcion: orden.cabecera.descripcion,
        fechaInicio: orden.cabecera.fechaInicio,
        fechaCompromiso: orden.cabecera.fechaCompromiso,
        fechaFin: orden.cabecera.fechaFin,
        grupoTrabajoId: orden.cabecera.grupoTrabajoId,
        ordenTrabajoCabeceraPadreId: orden.cabecera.ordenTrabajoCabeceraPadreId,
        estado: orden.cabecera.estado,
        detalles: orden.detalles || [],
        personas: orden.personas || []
      }));
      
      this.blockUI.stop();
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al cargar los datos', 'error');
      console.error('Error:', error);
    }
  }

  async cargarCatalogos(): Promise<void> {
    try {
      // Cargar órdenes de servicio usando la API correcta
      const ordenesServicioResponse = await firstValueFrom(
        this.apiService.getOrdenesServicioMantenimientoExterno()
      );
      this.ordenesServicio = ordenesServicioResponse.map((os: any) => ({
        id: os.cabecera.id,
        nombre: os.cabecera.codigoOrdenInterna + ' - ' + os.cabecera.descripcion
      }));
      
      // Cargar grupos de trabajo usando la API correcta
      const gruposResponse = await firstValueFrom(
        this.apiService.getGruposTrabajo()
      );
      this.gruposTrabajo = gruposResponse.map((gt: any) => ({
        id: gt.cabecera.id,
        nombre: gt.cabecera.nombre
      }));
      
      // Cargar ubicaciones técnicas
      const ubicacionesResponse = await firstValueFrom(
        this.apiService.getUbicacionesTecnicasActivas()
      );
      this.ubicacionesTecnicas = ubicacionesResponse;
      
      // Cargar labores
      const laboresResponse = await firstValueFrom(
        this.apiService.getLabores()
      );
      this.labores = laboresResponse;
      
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  }

  onSelectionChangedGrid(event: any): void {
    if (event.selectedRowsData && event.selectedRowsData.length > 0) {
      this.ordenSeleccionada = event.selectedRowsData[0];
      this.cargarDetallesDeOrden();
      this.activarAgregarDetalles = true;
    } else {
      this.ordenSeleccionada = null;
      this.detalles = [];
      this.activarAgregarDetalles = false;
    }
  }

  cargarDetallesDeOrden(): void {
    if (!this.ordenSeleccionada || !this.ordenSeleccionada.detalles) {
      this.detalles = [];
      return;
    }

    this.detalles = this.ordenSeleccionada.detalles.map((det: any) => ({
      id: det.detalle.id,
      empresaId: det.detalle.empresaId,
      ubicacionTecnicaId: det.detalle.ubicacionTecnicaId,
      laborId: det.detalle.laborId,
      horasProyectadas: det.detalle.horasProyectadas,
      horasEjecutadas: det.detalle.horasEjecutadas,
      descripcion: det.detalle.descripcion,
      estado: det.detalle.estado,
      activoId: det.activo?.activoId || 1
    }));
  }

  async insertarTipo(event: any): Promise<void> {
    try {
      this.blockUI.start('Guardando...');
      
      const nuevaOrden = {
        cabecera: {
          empresaId: event.data.empresaId || 1,
          ordenServicioCabeceraId: event.data.ordenServicioCabeceraId,
          nombre: event.data.nombre,
          descripcion: event.data.descripcion || '',
          fechaInicio: event.data.fechaInicio,
          fechaCompromiso: event.data.fechaCompromiso,
          fechaFin: event.data.fechaFin || event.data.fechaCompromiso,
          grupoTrabajoId: event.data.grupoTrabajoId,
          ordenTrabajoCabeceraPadreId: event.data.ordenTrabajoCabeceraPadreId || null,
          estado: event.data.estado || 1
        },
        detalles: [],
        personas: []
      };

      await firstValueFrom(
        this.apiService.crearOrdenTrabajoMantenimientoExterno(nuevaOrden)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Orden de trabajo creada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear la orden de trabajo', 'error');
      console.error('Error:', error);
    }
  }

  async actualizarTipo(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const ordenActualizada = {
        cabecera: {
          empresaId: event.newData.empresaId ?? event.oldData.empresaId,
          ordenServicioCabeceraId: event.newData.ordenServicioCabeceraId ?? event.oldData.ordenServicioCabeceraId,
          nombre: event.newData.nombre ?? event.oldData.nombre,
          descripcion: event.newData.descripcion ?? event.oldData.descripcion,
          fechaInicio: event.newData.fechaInicio ?? event.oldData.fechaInicio,
          fechaCompromiso: event.newData.fechaCompromiso ?? event.oldData.fechaCompromiso,
          fechaFin: event.newData.fechaFin ?? event.oldData.fechaFin,
          grupoTrabajoId: event.newData.grupoTrabajoId ?? event.oldData.grupoTrabajoId,
          ordenTrabajoCabeceraPadreId: event.newData.ordenTrabajoCabeceraPadreId ?? event.oldData.ordenTrabajoCabeceraPadreId,
          estado: event.newData.estado ?? event.oldData.estado
        },
        detalles: event.oldData.detalles || [],
        personas: event.oldData.personas || []
      };

      await firstValueFrom(
        this.apiService.actualizarOrdenTrabajoMantenimientoExterno(event.key, ordenActualizada)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Orden de trabajo actualizada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar la orden de trabajo', 'error');
      console.error('Error:', error);
    }
  }

  async eliminarTipo(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarOrdenTrabajoMantenimientoExterno(event.key)
      );
      
      this.ordenSeleccionada = null;
      this.detalles = [];
      this.activarAgregarDetalles = false;
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Orden de trabajo eliminada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar la orden de trabajo', 'error');
      console.error('Error:', error);
    }
  }

  async insertarParametro(event: any): Promise<void> {
    if (!this.ordenSeleccionada) {
      this.mostrarMensaje('Debe seleccionar una orden de trabajo', 'error');
      return;
    }

    try {
      this.blockUI.start('Guardando detalle...');
      
      const nuevoDetalle = {
        detalle: {
          id: 0,
          empresaId: event.data.empresaId || 1,
          ubicacionTecnicaId: event.data.ubicacionTecnicaId,
          laborId: event.data.laborId,
          horasProyectadas: event.data.horasProyectadas || 0,
          horasEjecutadas: event.data.horasEjecutadas || 0,
          descripcion: event.data.descripcion || '',
          estado: event.data.estado || 1
        },
        activo: {
          id: 0,
          empresaId: event.data.empresaId || 1,
          activoId: event.data.activoId || 1
        }
      };

      const detallesActualizados = [...(this.ordenSeleccionada.detalles || []), nuevoDetalle];

      const datosActualizados = {
        cabecera: {
          empresaId: this.ordenSeleccionada.empresaId,
          ordenServicioCabeceraId: this.ordenSeleccionada.ordenServicioCabeceraId,
          nombre: this.ordenSeleccionada.nombre,
          descripcion: this.ordenSeleccionada.descripcion,
          fechaInicio: this.ordenSeleccionada.fechaInicio,
          fechaCompromiso: this.ordenSeleccionada.fechaCompromiso,
          fechaFin: this.ordenSeleccionada.fechaFin,
          grupoTrabajoId: this.ordenSeleccionada.grupoTrabajoId,
          ordenTrabajoCabeceraPadreId: this.ordenSeleccionada.ordenTrabajoCabeceraPadreId,
          estado: this.ordenSeleccionada.estado
        },
        detalles: detallesActualizados,
        personas: this.ordenSeleccionada.personas || []
      };

      await firstValueFrom(
        this.apiService.actualizarOrdenTrabajoMantenimientoExterno(this.ordenSeleccionada.id!, datosActualizados)
      );
      
      await this.cargarDatos();
      
      // Reseleccionar la orden
      this.filasSeleccionadasOrden = [this.ordenSeleccionada.id!];
      const ordenActualizada = this.ordenes.find(o => o.id === this.ordenSeleccionada!.id);
      if (ordenActualizada) {
        this.ordenSeleccionada = ordenActualizada;
        this.cargarDetallesDeOrden();
      }
      
      this.blockUI.stop();
      this.mostrarMensaje('Detalle agregado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al agregar el detalle', 'error');
      console.error('Error:', error);
    }
  }

  async actualizarParametro(event: any): Promise<void> {
    if (!this.ordenSeleccionada) return;

    try {
      this.blockUI.start('Actualizando detalle...');
      
      const detallesActualizados = this.ordenSeleccionada.detalles!.map((det: any) => {
        if (det.detalle.id === event.key) {
          return {
            detalle: {
              id: det.detalle.id,
              empresaId: det.detalle.empresaId,
              ubicacionTecnicaId: event.newData.ubicacionTecnicaId ?? det.detalle.ubicacionTecnicaId,
              laborId: event.newData.laborId ?? det.detalle.laborId,
              horasProyectadas: event.newData.horasProyectadas ?? det.detalle.horasProyectadas,
              horasEjecutadas: event.newData.horasEjecutadas ?? det.detalle.horasEjecutadas,
              descripcion: event.newData.descripcion ?? det.detalle.descripcion,
              estado: event.newData.estado ?? det.detalle.estado
            },
            activo: {
              id: det.activo?.id || 0,
              empresaId: det.activo?.empresaId || 1,
              activoId: event.newData.activoId ?? det.activo?.activoId ?? 1
            }
          };
        }
        return det;
      });

      const datosActualizados = {
        cabecera: {
          empresaId: this.ordenSeleccionada.empresaId,
          ordenServicioCabeceraId: this.ordenSeleccionada.ordenServicioCabeceraId,
          nombre: this.ordenSeleccionada.nombre,
          descripcion: this.ordenSeleccionada.descripcion,
          fechaInicio: this.ordenSeleccionada.fechaInicio,
          fechaCompromiso: this.ordenSeleccionada.fechaCompromiso,
          fechaFin: this.ordenSeleccionada.fechaFin,
          grupoTrabajoId: this.ordenSeleccionada.grupoTrabajoId,
          ordenTrabajoCabeceraPadreId: this.ordenSeleccionada.ordenTrabajoCabeceraPadreId,
          estado: this.ordenSeleccionada.estado
        },
        detalles: detallesActualizados,
        personas: this.ordenSeleccionada.personas || []
      };

      await firstValueFrom(
        this.apiService.actualizarOrdenTrabajoMantenimientoExterno(this.ordenSeleccionada.id!, datosActualizados)
      );
      
      await this.cargarDatos();
      
      // Reseleccionar la orden
      this.filasSeleccionadasOrden = [this.ordenSeleccionada.id!];
      const ordenActualizada = this.ordenes.find(o => o.id === this.ordenSeleccionada!.id);
      if (ordenActualizada) {
        this.ordenSeleccionada = ordenActualizada;
        this.cargarDetallesDeOrden();
      }
      
      this.blockUI.stop();
      this.mostrarMensaje('Detalle actualizado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar el detalle', 'error');
      console.error('Error:', error);
    }
  }

  async eliminarParametro(event: any): Promise<void> {
    if (!this.ordenSeleccionada) return;

    try {
      this.blockUI.start('Eliminando detalle...');
      
      const detallesActualizados = this.ordenSeleccionada.detalles!.filter(
        (det: any) => det.detalle.id !== event.key
      );

      const datosActualizados = {
        cabecera: {
          empresaId: this.ordenSeleccionada.empresaId,
          ordenServicioCabeceraId: this.ordenSeleccionada.ordenServicioCabeceraId,
          nombre: this.ordenSeleccionada.nombre,
          descripcion: this.ordenSeleccionada.descripcion,
          fechaInicio: this.ordenSeleccionada.fechaInicio,
          fechaCompromiso: this.ordenSeleccionada.fechaCompromiso,
          fechaFin: this.ordenSeleccionada.fechaFin,
          grupoTrabajoId: this.ordenSeleccionada.grupoTrabajoId,
          ordenTrabajoCabeceraPadreId: this.ordenSeleccionada.ordenTrabajoCabeceraPadreId,
          estado: this.ordenSeleccionada.estado
        },
        detalles: detallesActualizados,
        personas: this.ordenSeleccionada.personas || []
      };

      await firstValueFrom(
        this.apiService.actualizarOrdenTrabajoMantenimientoExterno(this.ordenSeleccionada.id!, datosActualizados)
      );
      
      await this.cargarDatos();
      
      // Reseleccionar la orden
      this.filasSeleccionadasOrden = [this.ordenSeleccionada.id!];
      const ordenActualizada = this.ordenes.find(o => o.id === this.ordenSeleccionada!.id);
      if (ordenActualizada) {
        this.ordenSeleccionada = ordenActualizada;
        this.cargarDetallesDeOrden();
      }
      
      this.blockUI.stop();
      this.mostrarMensaje('Detalle eliminado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar el detalle', 'error');
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