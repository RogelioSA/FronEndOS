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
  terceros: any[] = [];

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    try {
      this.blockUI.start('Cargando datos...');

      // Cargar órdenes de servicio
      const ordenesResponse = await firstValueFrom(
        this.apiService.getOrdenesServicioMantenimientoExterno()
      );
      
      // Cargar tipos de orden
      const tiposResponse = await firstValueFrom(
        this.apiService.getOrdenesServicioTipo()
      );
      this.ordenesServicioTipo = tiposResponse;

      // Cargar terceros (clientes)
      const tercerosResponse = await firstValueFrom(
        this.apiService.getTerceros()
      );
      this.terceros = tercerosResponse;

      // Transformar la respuesta para aplanar la estructura
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
      // Campos de cabecera
      id: orden.id,
      empresaId: orden.empresaId,
      ordenServicioTipoId: orden.ordenServicioTipoId,
      codigoOrdenInterna: orden.codigoOrdenInterna,
      codigoReferencial: orden.codigoReferencial,
      descripcion: orden.descripcion,
      activo: orden.activo,
      fechaInicial: orden.fechaInicial,
      fechaFinal: orden.fechaFinal,
      fechaEntrega: orden.fechaEntrega,
      
      // Campos de externo
      externoId: orden.externo?.id,
      clienteId: orden.externo?.clienteId,
      clienteSupervisorId: orden.externo?.clienteSupervisorId,
      contratoCabeceraId: orden.externo?.contratoCabeceraId,
      clientePlannerId: orden.externo?.clientePlannerId,
      cotizacionId: orden.externo?.cotizacionId,
      actaConformidadId: orden.externo?.actaConformidadId,
      monedaId: orden.externo?.monedaId,
      licitacionCodigo: orden.externo?.licitacionCodigo,
      cpi: orden.externo?.cpi,
      fechaEntregaCorreo: orden.externo?.fechaEntregaCorreo,
      fechaFianzaInicio: orden.externo?.fechaFianzaInicio,
      fechaFianzaFinal: orden.externo?.fechaFianzaFinal,
      montoBruto: orden.externo?.montoBruto,
      montoNeto: orden.externo?.montoNeto,
      montoFianza: orden.externo?.montoFianza,
      reporteMedicion: orden.externo?.reporteMedicion,
      reporteCalidad: orden.externo?.reporteCalidad,
      fechaEntregaInforme: orden.externo?.fechaEntregaInforme,
      fechaRecepcionHES: orden.externo?.fechaRecepcionHES,
      numeroHES: orden.externo?.numeroHES,
      mantenimientoTipoId: orden.externo?.mantenimientoTipoId,
      numeroFactura: orden.externo?.numeroFactura,
      valorFacturadoNeto: orden.externo?.valorFacturadoNeto,
      fechaFactura: orden.externo?.fechaFactura,
      fechaRecepcionFactura: orden.externo?.fechaRecepcionFactura,
      fechaVencimientoFactura: orden.externo?.fechaVencimientoFactura,
      fechaPagoFactura: orden.externo?.fechaPagoFactura
    }));
  }

  construirPayload(rowData: any): any {
    return {
      cabecera: {
        empresaId: rowData.empresaId || 0,
        ordenServicioTipoId: rowData.ordenServicioTipoId || 0,
        codigoOrdenInterna: rowData.codigoOrdenInterna || '',
        codigoReferencial: rowData.codigoReferencial || '',
        descripcion: rowData.descripcion || '',
        activo: rowData.activo !== undefined ? rowData.activo : true,
        fechaInicial: rowData.fechaInicial || new Date().toISOString(),
        fechaFinal: rowData.fechaFinal || new Date().toISOString(),
        fechaEntrega: rowData.fechaEntrega || new Date().toISOString()
      },
      externo: {
        id: rowData.externoId || 0,
        empresaId: rowData.empresaId || 0,
        clienteId: rowData.clienteId || 0,
        clienteSupervisorId: rowData.clienteSupervisorId || 1,
        contratoCabeceraId: rowData.contratoCabeceraId || 1,
        clientePlannerId: rowData.clientePlannerId || 1,
        cotizacionId: rowData.cotizacionId || 1,
        actaConformidadId: rowData.actaConformidadId || 1,
        monedaId: rowData.monedaId || 1,
        licitacionCodigo: rowData.licitacionCodigo || '',
        cpi: rowData.cpi || '',
        fechaEntregaCorreo: rowData.fechaEntregaCorreo || new Date().toISOString(),
        fechaFianzaInicio: rowData.fechaFianzaInicio || new Date().toISOString(),
        fechaFianzaFinal: rowData.fechaFianzaFinal || new Date().toISOString(),
        montoBruto: rowData.montoBruto || 0,
        montoNeto: rowData.montoNeto || 0,
        montoFianza: rowData.montoFianza || 0,
        reporteMedicion: rowData.reporteMedicion || 'N/A',  // ✅ Valor por defecto
        reporteCalidad: rowData.reporteCalidad || 'N/A',    // ✅ Valor por defecto
        fechaEntregaInforme: rowData.fechaEntregaInforme || new Date().toISOString(),
        fechaRecepcionHES: rowData.fechaRecepcionHES || new Date().toISOString(),
        numeroHES: rowData.numeroHES || 0,
        mantenimientoTipoId: rowData.mantenimientoTipoId || 1,
        numeroFactura: rowData.numeroFactura || '',
        valorFacturadoNeto: rowData.valorFacturadoNeto || 0,
        fechaFactura: rowData.fechaFactura || new Date().toISOString(),
        fechaRecepcionFactura: rowData.fechaRecepcionFactura || new Date().toISOString(),
        fechaVencimientoFactura: rowData.fechaVencimientoFactura || new Date().toISOString(),
        fechaPagoFactura: rowData.fechaPagoFactura || new Date().toISOString()
      }
    };
  }
  async insertar(e: any) {
    try {
      this.blockUI.start('Guardando...');
      
      const payload = this.construirPayload(e.data);
      
      await firstValueFrom(
        this.apiService.registrarOrdenServicioMantenimientoExterno(payload)
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
        this.apiService.actualizarOrdenServicioMantenimientoExterno(e.key, payload)
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
        this.apiService.eliminarOrdenServicioMantenimientoExterno(e.key)
      );

      this.mostrarMensaje('Orden de servicio eliminada exitosamente', 'success');
      
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

  calculateRazonSocialCliente = (rowData: any) => {
    const cliente = this.terceros.find(t => t.id === rowData.clienteId);
    return cliente ? cliente.razonSocial : '';
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