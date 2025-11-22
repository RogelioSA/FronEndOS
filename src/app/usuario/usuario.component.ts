import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

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
      
      // Mapear usuarios y establecer password como "-" para visualización
      this.usuarios = usuariosResponse.map((usuario: any) => ({
        ...usuario,
        password: '-'
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

  construirPayload(rowData: any): CrearUsuarioPayload {
    return {
      email: rowData.userName || rowData.email,
      password: rowData.password
    };
  }

  async insertarUsuario(e: any) {
    console.log('=== INSERTAR USUARIO ===');
    console.log('Evento:', e);
    
    try {
      this.blockUI.start('Guardando usuario...');

      const payload = this.construirPayload(e.data);

      await firstValueFrom(
        this.apiService.crearUsuario(payload)
      );
      await this.cargarDatos();

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al insertar usuario:', error);
      this.blockUI.stop();
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
      // Validar que se haya ingresado una contraseña y que no sea "-"
      if (!e.newData.password || e.newData.password.trim() === '' || e.newData.password === '-') {
        console.log('ERROR: No hay contraseña válida');
        
        e.cancel = true;
        return;
      }

      this.blockUI.start('Actualizando contraseña...');

      const id = e.key;
      
      // El backend requiere el email también
      const payload = {
        email: e.oldData.userName || e.oldData.email,
        password: e.newData.password
      };

      console.log('Enviando:', payload);

      await firstValueFrom(
        this.apiService.editarUsuario(id, payload)
      );

      
      await this.cargarDatos();

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al editar usuario:', error);
      this.blockUI.stop();
      
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