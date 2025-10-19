import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface Tercero {
  empresaId: number;
  id: number;
  documentoIdentidadTipoFinancieroId: number;
  documentoIdentidadFinanciero: string;
  razonSocial: string;
  direccionFiscal: string;
  cuentaContablePorCobrarId: number;
  cuentaContablePorPagarId: number;
  documentoIdentidadTipoFinanciero?: any;
  cuentaContablePorCobrar?: any;
  cuentaContablePorPagar?: any;
  persona?: any;
}

@Component({
  selector: 'app-tercero',
  standalone: false,
  templateUrl: './tercero.component.html',
  styleUrl: './tercero.component.css'
})
export class TerceroComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  terceros: Tercero[] = [];
  cuentasContables: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      
      // Cargar cuentas contables para los lookups
      const cuentasResponse = await firstValueFrom(
        this.apiService.getCuentasContablesActivas()
      );
      this.cuentasContables = cuentasResponse;
      
      // Cargar terceros
      const tercerosResponse = await firstValueFrom(
        this.apiService.getTerceros()
      );
      this.terceros = tercerosResponse;
      
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
        empresaId: event.data.empresaId || 1,
        // NO enviar el campo 'id' al crear
        documentoIdentidadTipoFinancieroId: event.data.documentoIdentidadTipoFinancieroId || 1,
        documentoIdentidadFinanciero: event.data.documentoIdentidadFinanciero,
        razonSocial: event.data.razonSocial,
        direccionFiscal: event.data.direccionFiscal || '',
        cuentaContablePorCobrarId: event.data.cuentaContablePorCobrarId || 1,
        cuentaContablePorPagarId: event.data.cuentaContablePorPagarId || 1
      };
  
      await firstValueFrom(
        this.apiService.registrarTercero(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Tercero creado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear el tercero', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        empresaId: event.newData.empresaId ?? event.oldData.empresaId,
        id: event.key, // El ID del registro que se está actualizando
        documentoIdentidadTipoFinancieroId: event.newData.documentoIdentidadTipoFinancieroId ?? event.oldData.documentoIdentidadTipoFinancieroId,
        documentoIdentidadFinanciero: event.newData.documentoIdentidadFinanciero ?? event.oldData.documentoIdentidadFinanciero,
        razonSocial: event.newData.razonSocial ?? event.oldData.razonSocial,
        direccionFiscal: event.newData.direccionFiscal ?? event.oldData.direccionFiscal,
        cuentaContablePorCobrarId: event.newData.cuentaContablePorCobrarId ?? event.oldData.cuentaContablePorCobrarId,
        cuentaContablePorPagarId: event.newData.cuentaContablePorPagarId ?? event.oldData.cuentaContablePorPagarId
      };
  
      await firstValueFrom(
        this.apiService.actualizarTercero(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Tercero actualizado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar el tercero', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarTercero(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Tercero eliminado exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar el tercero', 'error');
      console.error('Error:', error);
    }
  }

  calculateNombreCuentaCobrar = (rowData: any) => {
    const cuenta = this.cuentasContables.find(c => c.id === rowData.cuentaContablePorCobrarId);
    return cuenta ? cuenta.nombre : '';
  }

  calculateNombreCuentaPagar = (rowData: any) => {
    const cuenta = this.cuentasContables.find(c => c.id === rowData.cuentaContablePorPagarId);
    return cuenta ? cuenta.nombre : '';
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