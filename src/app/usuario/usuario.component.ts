import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface CrearUsuarioPayload {
  usuario: {
    email: string;
  };
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

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    try {
      this.blockUI.start('Cargando usuarios...');

      const usuariosResponse = await firstValueFrom(
        this.apiService.listarUsuarioEmpresa()
      );
      this.usuarios = usuariosResponse;

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al cargar los usuarios', 'error');
    }
  }

  construirPayload(rowData: any): CrearUsuarioPayload {
    return {
      usuario: {
        email: rowData.email
      },
      password: rowData.password
    };
  }

  async insertarUsuario(e: any) {
    try {
      this.blockUI.start('Guardando usuario...');

      const payload = this.construirPayload(e.data);

      await firstValueFrom(
        this.apiService.crearUsuario(payload)
      );

      this.mostrarMensaje('Usuario creado exitosamente', 'success');
      await this.cargarDatos();

      this.blockUI.stop();
    } catch (error) {
      console.error('Error al insertar usuario:', error);
      this.blockUI.stop();
      this.mostrarMensaje('Error al guardar el usuario', 'error');
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