import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface CuentaContable {
  empresaId: number;
  id: number;
  nombre: string;
  nombreCorto: string;
  activo: boolean;
  es: string;
  cuentaContableTipoId: number;
  nivel: number;
  padreId: number | null;
  permiteMovimiento: boolean;
  cuentaContableTipo?: any;
  padre?: any;
  children?: any[];
}

@Component({
  selector: 'app-cuenta-contable',
  standalone: false,
  templateUrl: './cuenta-contable.component.html',
  styleUrl: './cuenta-contable.component.css'
})
export class CuentaContableComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  cuentas: CuentaContable[] = [];
  opcionesEs: any[] = [
    { valor: 'E', texto: 'Entrada' },
    { valor: 'S', texto: 'Salida' },
    { valor: 'A', texto: 'Ambos' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      const response = await firstValueFrom(
        this.apiService.getCuentasContablesActivas()
      );
      this.cuentas = response;
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
        es: event.data.es || 'E',
        cuentaContableTipoId: event.data.cuentaContableTipoId || 1,
        nivel: event.data.nivel || 1,
        padreId: event.data.padreId || null,
        permiteMovimiento: event.data.permiteMovimiento !== undefined ? event.data.permiteMovimiento : true
      };

      await firstValueFrom(
        this.apiService.registrarCuentaContable(nuevoRegistro)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Cuenta contable creada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al crear la cuenta contable', 'error');
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
        es: event.newData.es ?? event.oldData.es,
        cuentaContableTipoId: event.newData.cuentaContableTipoId ?? event.oldData.cuentaContableTipoId,
        nivel: event.newData.nivel ?? event.oldData.nivel,
        padreId: event.newData.padreId ?? event.oldData.padreId,
        permiteMovimiento: event.newData.permiteMovimiento ?? event.oldData.permiteMovimiento
      };

      await firstValueFrom(
        this.apiService.actualizarCuentaContable(event.key, datosActualizados)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Cuenta contable actualizada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al actualizar la cuenta contable', 'error');
      console.error('Error:', error);
    }
  }

  async eliminar(event: any): Promise<void> {
    try {
      this.blockUI.start('Eliminando...');
      
      await firstValueFrom(
        this.apiService.eliminarCuentaContable(event.key)
      );
      
      await this.cargarDatos();
      this.blockUI.stop();
      this.mostrarMensaje('Cuenta contable eliminada exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarMensaje('Error al eliminar la cuenta contable', 'error');
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