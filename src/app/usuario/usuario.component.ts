import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DxDataGridComponent } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';

interface CrearUsuarioPayload {
  email: string;
  password: string;
}

@Component({
  selector: 'app-usuario',
  standalone: false,
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.css'
})
export class UsuarioComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;

  usuarios: any[] = [];

  constructor(
    private apiService: ApiService
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    try {
      this.blockUI.start('Cargando usuarios...');

      const usuariosResponse = await firstValueFrom(
        this.apiService.listarUsuarioEmpresa()
      );
      
      // Mapear usuarios y establecer password como vacío para visualización
      this.usuarios = usuariosResponse.map((usuario: any) => ({
        ...usuario,
        password: ''
      }));

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.blockUI.stop();
    }
  }

  onSaving(e: any) {
    console.log('=== ON SAVING EVENT ===');
    console.log('Evento completo:', e);
    console.log('Changes:', e.changes);
  }

  async insertarUsuario(e: any) {
    console.log('=== INSERTAR USUARIO ===');
    console.log('Datos a insertar:', e.data);
    
    try {
      // Validar que ambos campos estén presentes
      if (!e.data.userName || !e.data.password) {
        notify('Debe ingresar correo y contraseña', 'error', 3000);
        e.cancel = true;
        return;
      }

      this.blockUI.start('Guardando usuario...');

      const payload: CrearUsuarioPayload = {
        email: e.data.userName,
        password: e.data.password
      };

      console.log('Payload a enviar:', payload);

      await firstValueFrom(
        this.apiService.crearUsuario(payload)
      );
      
      notify('Usuario creado exitosamente', 'success', 3000);
      await this.cargarDatos();

      this.blockUI.stop();
    } catch (error: any) {
      console.error('Error al insertar usuario:', error);
      this.blockUI.stop();
      
      // Capturar errores de validación del API
      if (error?.error?.errors && Array.isArray(error.error.errors)) {
        // Mostrar todos los errores de validación
        const mensajes = error.error.errors
          .map((err: any) => `${err.field}: ${err.message}`)
          .join('\n');
        
        notify({
          message: mensajes,
          width: 450,
          position: {
            at: 'top',
            my: 'top',
            of: window
          }
        }, 'error', 5000);
      } else if (error?.error?.title) {
        notify(error.error.title, 'error', 3000);
      } else {
        notify('Error al crear usuario', 'error', 3000);
      }
      
      e.cancel = true;
    }
  }

  async editarUsuario(e: any) {
    console.log('=== EDITAR USUARIO ===');
    console.log('Evento completo:', e);
    console.log('e.key (ID):', e.key);
    console.log('e.newData:', e.newData);
    console.log('e.oldData:', e.oldData);
    
    try {
      // Validar que se haya ingresado una contraseña y que no sea vacía
      if (e.newData.password !== undefined && 
          (!e.newData.password || e.newData.password.trim() === '')) {
        notify('Debe ingresar una contraseña válida', 'error', 3000);
        e.cancel = true;
        return;
      }

      this.blockUI.start('Actualizando contraseña...');

      const id = e.key;
      
      // El backend requiere el email también
      const payload: CrearUsuarioPayload = {
        email: e.oldData.userName || e.oldData.email,
        password: e.newData.password
      };

      console.log('Enviando:', payload);

      await firstValueFrom(
        this.apiService.editarUsuario(id, payload)
      );

      notify('Contraseña actualizada exitosamente', 'success', 3000);
      await this.cargarDatos();

      this.blockUI.stop();
    } catch (error: any) {
      console.error('Error al editar usuario:', error);
      this.blockUI.stop();
      
      // Capturar errores de validación del API
      if (error?.error?.errors && Array.isArray(error.error.errors)) {
        const mensajes = error.error.errors
          .map((err: any) => `${err.field}: ${err.message}`)
          .join('\n');
        
        notify({
          message: mensajes,
          width: 450,
          position: {
            at: 'top',
            my: 'top',
            of: window
          }
        }, 'error', 5000);
      } else if (error?.error?.title) {
        notify(error.error.title, 'error', 3000);
      } else {
        notify('Error al actualizar contraseña', 'error', 3000);
      }
      
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
      messageBox.style.maxWidth = '100%';
      messageBox.style.wordWrap = 'break-word';

      setTimeout(() => {
        if (messageBox) {
          messageBox.style.display = 'none';
        }
      }, 5000);
    }
  }
}