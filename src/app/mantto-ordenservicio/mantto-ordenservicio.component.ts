import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface OrdenServicio {
  id?: number;
  empresaId: number;
  ordenServicioTipoId: number;
  codigoOrdenInterna: string;
  codigoReferencial: string;
  descripcion: string;
  activo: boolean;
  fechaInicial: string;
  fechaFinal: string;
  fechaEntrega: string;
  clienteId: number;
  clienteSupervisorId: number;
  contratoCabeceraId: number;
  clientePlannerId: number;
  cotizacionId: number;
  actaConformidadId: number;
  monedaId: number;
  licitacionCodigo: string;
  cpi: string;
  fechaEntregaCorreo: string;
  fechaFianzaInicio: string;
  fechaFianzaFinal: string;
  montoBruto: number;
  montoNeto: number;
  montoFianza: number;
  reporteMedicion: string;
  reporteCalidad: string;
  fechaEntregaInforme: string;
  fechaRecepcionHES: string;
  numeroHES: number;
  mantenimientoTipoId: number;
  numeroFactura: string;
  valorFacturadoNeto: number;
  fechaFactura: string;
  fechaRecepcionFactura: string;
  fechaVencimientoFactura: string;
  fechaPagoFactura: string;
  ordenServicioTipo?: any;
  cliente?: any;
}

@Component({
  selector: 'app-mantto-ordenservicio',
  standalone: false,
  templateUrl: './mantto-ordenservicio.component.html',
  styleUrl: './mantto-ordenservicio.component.css'
})
export class ManttoOrdenservicioComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  ordenes: OrdenServicio[] = [];
  ordenesServicioTipo: any[] = [];
  terceros: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      
      // Cargar tipos de orden de servicio
      const tiposResponse = await firstValueFrom(
        this.apiService.getOrdenesServicioTipo()
      );
      this.ordenesServicioTipo = tiposResponse;
      
      // Cargar terceros (clientes)
      const tercerosResponse = await firstValueFrom(
        this.apiService.getTerceros()
      );
      this.terceros = tercerosResponse;
      
      // Cargar órdenes de servicio
      const ordenesResponse = await firstValueFrom(
        this.apiService.getOrdenesServicioMantenimientoExterno()
      );
      
      // Aplanar la estructura para el grid
      this.ordenes = ordenesResponse.map((item: any) => ({
        id: item.cabecera.id,
        empresaId: item.cabecera.empresaId,
        ordenServicioTipoId: item.cabecera.ordenServicioTipoId,
        codigoOrdenInterna: item.cabecera.codigoOrdenInterna,
        codigoReferencial: item.cabecera.codigoReferencial,
        descripcion: item.cabecera.descripcion,
        activo: item.cabecera.activo,
        fechaInicial: item.cabecera.fechaInicial,
        fechaFinal: item.cabecera.fechaFinal,
        fechaEntrega: item.cabecera.fechaEntrega,
        clienteId: item.externo.clienteId,
        clienteSupervisorId: item.externo.clienteSupervisorId,
        contratoCabeceraId: item.externo.contratoCabeceraId,
        clientePlannerId: item.externo.clientePlannerId,
        cotizacionId: item.externo.cotizacionId,
        actaConformidadId: item.externo.actaConformidadId,
        monedaId: item.externo.monedaId,
        licitacionCodigo: item.externo.licitacionCodigo,
        cpi: item.externo.cpi,
        fechaEntregaCorreo: item.externo.fechaEntregaCorreo,
        fechaFianzaInicio: item.externo.fechaFianzaInicio,
        fechaFianzaFinal: item.externo.fechaFianzaFinal,
        montoBruto: item.externo.montoBruto,
        montoNeto: item.externo.montoNeto,
        montoFianza: item.externo.montoFianza,
        reporteMedicion: item.externo.reporteMedicion,
        reporteCalidad: item.externo.reporteCalidad,
        fechaEntregaInforme: item.externo.fechaEntregaInforme,
        fechaRecepcionHES: item.externo.fechaRecepcionHES,
        numeroHES: item.externo.numeroHES,
        mantenimientoTipoId: item.externo.mantenimientoTipoId,
        numeroFactura: item.externo.numeroFactura,
        valorFacturadoNeto: item.externo.valorFacturadoNeto,
        fechaFactura: item.externo.fechaFactura,
        fechaRecepcionFactura: item.externo.fechaRecepcionFactura,
        fechaVencimientoFactura: item.externo.fechaVencimientoFactura,
        fechaPagoFactura: item.externo.fechaPagoFactura,
        ordenServicioTipo: item.cabecera.ordenServicioTipo,
        cliente: item.externo.cliente
      }));
      
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
        cabecera: {
          empresaId: event.data.empresaId || 1,
          ordenServicioTipoId: event.data.ordenServicioTipoId,
          codigoOrdenInterna: event.data.codigoOrdenInterna,
          codigoReferencial: event.data.codigoReferencial || '',
          descripcion: event.data.descripcion,
          activo: event.data.activo !== undefined ? event.data.activo : true,
          fechaInicial: event.data.fechaInicial,
          fechaFinal: event.data.fechaFinal,
          fechaEntrega: event.data.fechaEntrega
        },
        externo: {
          empresaId: event.data.empresaId || 1,
          clienteId: event.data.clienteId,
          clienteSupervisorId: event.data.clienteSupervisorId || 1,
          contratoCabeceraId: event.data.contratoCabeceraId || 1,
          clientePlannerId: event.data.clientePlannerId || 1,
          cotizacionId: event.data.cotizacionId || 1,
          actaConformidadId: event.data.actaConformidadId || 1,
          monedaId: event.data.monedaId || 1,
          licitacionCodigo: event.data.licitacionCodigo || '',
          cpi: event.data.cpi || '',
          fechaEntregaCorreo: event.data.fechaEntregaCorreo || new Date().toISOString(),
          fechaFianzaInicio: event.data.fechaFianzaInicio || new Date().toISOString(),
          fechaFianzaFinal: event.data.fechaFianzaFinal || new Date().toISOString(),
          montoBruto: event.data.montoBruto || 0,
          montoNeto: event.data.montoNeto || 0,
          montoFianza: event.data.montoFianza || 0,
          reporteMedicion: event.data.reporteMedicion || '',
          reporteCalidad: event.data.reporteCalidad || '',
          fechaEntregaInforme: event.data.fechaEntregaInforme || new Date().toISOString(),
          fechaRecepcionHES: event.data.fechaRecepcionHES || new Date().toISOString(),
          numeroHES: event.data.numeroHES || 0,
          mantenimientoTipoId: event.data.mantenimientoTipoId || 1,
          numeroFactura: event.data.numeroFactura || '',
          valorFacturadoNeto: event.data.valorFacturadoNeto || 0,
          fechaFactura: event.data.fechaFactura || new Date().toISOString(),
          fechaRecepcionFactura: event.data.fechaRecepcionFactura || new Date().toISOString(),
          fechaVencimientoFactura: event.data.fechaVencimientoFactura || new Date().toISOString(),
          fechaPagoFactura: event.data.fechaPagoFactura || new Date().toISOString()
        }
      };

      await firstValueFrom(
        this.apiService.registrarOrdenServicioMantenimientoExterno(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Orden de servicio creada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear la orden de servicio', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        cabecera: {
          empresaId: event.newData.empresaId ?? event.oldData.empresaId,
          ordenServicioTipoId: event.newData.ordenServicioTipoId ?? event.oldData.ordenServicioTipoId,
          codigoOrdenInterna: event.newData.codigoOrdenInterna ?? event.oldData.codigoOrdenInterna,
          codigoReferencial: event.newData.codigoReferencial ?? event.oldData.codigoReferencial,
          descripcion: event.newData.descripcion ?? event.oldData.descripcion,
          activo: event.newData.activo ?? event.oldData.activo,
          fechaInicial: event.newData.fechaInicial ?? event.oldData.fechaInicial,
          fechaFinal: event.newData.fechaFinal ?? event.oldData.fechaFinal,
          fechaEntrega: event.newData.fechaEntrega ?? event.oldData.fechaEntrega
        },
        externo: {
          empresaId: event.newData.empresaId ?? event.oldData.empresaId,
          clienteId: event.newData.clienteId ?? event.oldData.clienteId,
          clienteSupervisorId: event.newData.clienteSupervisorId ?? event.oldData.clienteSupervisorId,
          contratoCabeceraId: event.newData.contratoCabeceraId ?? event.oldData.contratoCabeceraId,
          clientePlannerId: event.newData.clientePlannerId ?? event.oldData.clientePlannerId,
          cotizacionId: event.newData.cotizacionId ?? event.oldData.cotizacionId,
          actaConformidadId: event.newData.actaConformidadId ?? event.oldData.actaConformidadId,
          monedaId: event.newData.monedaId ?? event.oldData.monedaId,
          licitacionCodigo: event.newData.licitacionCodigo ?? event.oldData.licitacionCodigo,
          cpi: event.newData.cpi ?? event.oldData.cpi,
          fechaEntregaCorreo: event.newData.fechaEntregaCorreo ?? event.oldData.fechaEntregaCorreo,
          fechaFianzaInicio: event.newData.fechaFianzaInicio ?? event.oldData.fechaFianzaInicio,
          fechaFianzaFinal: event.newData.fechaFianzaFinal ?? event.oldData.fechaFianzaFinal,
          montoBruto: event.newData.montoBruto ?? event.oldData.montoBruto,
          montoNeto: event.newData.montoNeto ?? event.oldData.montoNeto,
          montoFianza: event.newData.montoFianza ?? event.oldData.montoFianza,
          reporteMedicion: event.newData.reporteMedicion ?? event.oldData.reporteMedicion,
          reporteCalidad: event.newData.reporteCalidad ?? event.oldData.reporteCalidad,
          fechaEntregaInforme: event.newData.fechaEntregaInforme ?? event.oldData.fechaEntregaInforme,
          fechaRecepcionHES: event.newData.fechaRecepcionHES ?? event.oldData.fechaRecepcionHES,
          numeroHES: event.newData.numeroHES ?? event.oldData.numeroHES,
          mantenimientoTipoId: event.newData.mantenimientoTipoId ?? event.oldData.mantenimientoTipoId,
          numeroFactura: event.newData.numeroFactura ?? event.oldData.numeroFactura,
          valorFacturadoNeto: event.newData.valorFacturadoNeto ?? event.oldData.valorFacturadoNeto,
          fechaFactura: event.newData.fechaFactura ?? event.oldData.fechaFactura,
          fechaRecepcionFactura: event.newData.fechaRecepcionFactura ?? event.oldData.fechaRecepcionFactura,
          fechaVencimientoFactura: event.newData.fechaVencimientoFactura ?? event.oldData.fechaVencimientoFactura,
          fechaPagoFactura: event.newData.fechaPagoFactura ?? event.oldData.fechaPagoFactura
        }
      };

      await firstValueFrom(
        this.apiService.actualizarOrdenServicioMantenimientoExterno(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Orden de servicio actualizada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar la orden de servicio', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarOrdenServicioMantenimientoExterno(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Orden de servicio eliminada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar la orden de servicio', 'error');
      console.error('Error:', error);
    }
  }

  calculateNombreTipoOrden = (rowData: any) => {
    const tipo = this.ordenesServicioTipo.find(t => t.id === rowData.ordenServicioTipoId);
    return tipo ? tipo.nombre : '';
  }

  calculateRazonSocialCliente = (rowData: any) => {
    const cliente = this.terceros.find(t => t.id === rowData.clienteId);
    return cliente ? cliente.razonSocial : '';
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