import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface CuentaCorriente {
  id: number;
  empresaId: number;
  nombre: string;
  nombreCorto: string;
  activo: boolean;
  cuentaNumero: string;
  entidadFinancieraId: number;
  cuentaContableId: number;
  entidadFinanciera?: any;
  cuentaContable?: any;
}

@Component({
  selector: 'app-cuenta-corriente',
  standalone: false,
  templateUrl: './cuenta-corriente.component.html',
  styleUrl: './cuenta-corriente.component.css'
})
export class CuentaCorrienteComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  cuentasCorrientes: CuentaCorriente[] = [];
  entidadesFinancieras: any[] = [];
  cuentasContables: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      
      // Cargar entidades financieras para el lookup
      const entidadesResponse = await firstValueFrom(
        this.apiService.listarEntidadesFinancierasActivas()
      );
      this.entidadesFinancieras = entidadesResponse;
      
      // Cargar cuentas contables para el lookup
      const cuentasResponse = await firstValueFrom(
        this.apiService.getCuentasContablesActivas()
      );
      this.cuentasContables = cuentasResponse;
      
      // Cargar cuentas corrientes
      const cuentasCorrientesResponse = await firstValueFrom(
        this.apiService.listarCuentasCorrientesActivas()
      );
      this.cuentasCorrientes = cuentasCorrientesResponse;
      
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
        nombre: event.data.nombre,
        nombreCorto: event.data.nombreCorto,
        activo: event.data.activo !== undefined ? event.data.activo : true,
        cuentaNumero: event.data.cuentaNumero || '',
        entidadFinancieraId: event.data.entidadFinancieraId,
        cuentaContableId: event.data.cuentaContableId
      };

      await firstValueFrom(
        this.apiService.crearCuentaCorriente(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Cuenta corriente creada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear la cuenta corriente', 'error');
      console.error('Error:', error);
    }
  }

  async actualizar(event: any): Promise<void> {
    try {
      this.blockUI.start('Actualizando...');
      
      const datosActualizados = {
        empresaId: event.newData.empresaId ?? event.oldData.empresaId,
        nombre: event.newData.nombre ?? event.oldData.nombre,
        nombreCorto: event.newData.nombreCorto ?? event.oldData.nombreCorto,
        activo: event.newData.activo ?? event.oldData.activo,
        cuentaNumero: event.newData.cuentaNumero ?? event.oldData.cuentaNumero,
        entidadFinancieraId: event.newData.entidadFinancieraId ?? event.oldData.entidadFinancieraId,
        cuentaContableId: event.newData.cuentaContableId ?? event.oldData.cuentaContableId
      };

      await firstValueFrom(
        this.apiService.editarCuentaCorriente(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Cuenta corriente actualizada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar la cuenta corriente', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarCuentaCorriente(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Cuenta corriente eliminada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar la cuenta corriente', 'error');
      console.error('Error:', error);
    }
  }

  calculateNombreEntidad = (rowData: any) => {
    const entidad = this.entidadesFinancieras.find(e => e.id === rowData.entidadFinancieraId);
    return entidad ? entidad.nombre : '';
  }

  calculateNombreCuentaContable = (rowData: any) => {
    const cuenta = this.cuentasContables.find(c => c.id === rowData.cuentaContableId);
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