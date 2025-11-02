import { AuthService } from './../services/auth.service';
import { Component, HostListener } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-menu-bar',
    templateUrl: './menu-bar.component.html',
    styleUrl: './menu-bar.component.css',
    standalone: false
})
export class MenuBarComponent {

  menuBar: any[] = [];
  usuariosEmpresas: any[] = [];
  empresaSeleccionada: number | null = null;
  @BlockUI() blockUI!: NgBlockUI;

  menuOpen = false;
  isMobile = false;
  claims: any;
  private isInitialLoad = true;
  esUsuarioDocumento: boolean = false; // Nueva propiedad

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.checkIfMobile();
  }

  async ngOnInit(): Promise<void> {
    this.claims = this.authService.getClaims();
    
    // Verificar si es usuario logueado con documento
    this.esUsuarioDocumento = localStorage.getItem('tipo') === 'U';
    console.log('Es usuario con documento (tipo U):', this.esUsuarioDocumento);
    
    await this.traerUsuariosEmpresas();
    this.crearMenusEstaticos();
  }

  crearMenusEstaticos() {
    // Si es usuario con documento (tipo U), crear menú reducido
    if (this.esUsuarioDocumento) {
      this.menuBar = [
        // Menú Marcación
        {
          cNombre: 'Marcación',
          nCodigo: 23,
          nPadre: 0,
          cPath: '/procesos/marcacion',
          path: '/procesos/marcacion',
          icono: 'check',
          nOrden: 1,
          items: []
        },
        // Menú Mis Marcaciones
        {
          cNombre: 'Mis Marcaciones',
          nCodigo: 3,
          nPadre: 0,
          cPath: '/general/mismarcaciones',
          path: '/general/mismarcaciones',
          icono: 'event',
          nOrden: 2,
          items: []
        },
        // Menú de Usuario (al final)
        {
          cNombre: this.claims.cUsuario || 'Usuario',
          nCodigo: 990,
          nPadre: 0,
          nOrden: 999,
          cPath: '#',
          path: '#',
          cssClass: 'logout-item',
          icono: 'user',
          items: [
            {
              cNombre: 'Cerrar Sesión',
              nCodigo: 999,
              nPadre: 990,
              nOrden: 1000,
              cPath: '#',
              path: '#',
              icono: 'logout',
              items: []
            }
          ]
        }
      ];
      
      console.log('MenuBar reducido para usuario tipo U creado:', this.menuBar);
    } else {
      // Menú completo para usuarios normales
      this.menuBar = [
        {
          cNombre: 'Mantenimiento',
          nCodigo: 1,
          nPadre: 0,
          cPath: '#',
          path: '#',
          icono: 'user',
          nOrden: 1,
          items: [
            {
              cNombre: 'Usuario',
              nCodigo: 11,
              nPadre: 1,
              cPath: '/mantenimiento/usuario',
              path: '/mantenimiento/usuario',
              icono: 'user',
              nOrden: 1,
              items: []
            }
          ]
        },
        // Menú Personal
        {
          cNombre: 'Personal',
          nCodigo: 1,
          nPadre: 0,
          cPath: '#',
          path: '#',
          icono: 'user',
          nOrden: 2,
          items: [
            {
              cNombre: 'Personal',
              nCodigo: 11,
              nPadre: 1,
              cPath: '/mantenimiento/personal',
              path: '/mantenimiento/personal',
              icono: 'user',
              nOrden: 1,
              items: []
            },
            {
              cNombre: 'Grupo Horario',
              nCodigo: 12,
              nPadre: 1,
              cPath: '/recursoshumanos/grupotrabajo',
              path: '/recursoshumanos/grupotrabajo',
              icono: 'clock',
              nOrden: 2,
              items: []
            },
            {
              cNombre: 'Personal Horario',
              nCodigo: 13,
              nPadre: 1,
              cPath: '/mantenimiento/grupoHorario/horario',
              path: '/mantenimiento/grupoHorario/horario',
              icono: 'calendar',
              nOrden: 3,
              items: []
            }
          ]
        },
        // Menú Ordenes de Servicio
        {
          cNombre: 'Ordenes Servicio',
          nCodigo: 2,
          nPadre: 0,
          cPath: '#',
          path: '#',
          icono: 'folder',
          nOrden: 2,
          items: [
            {
              cNombre: 'Ordenes Servicio',
              nCodigo: 21,
              nPadre: 2,
              cPath: '/procesos/ordenservicio',
              path: '/procesos/ordenservicio',
              icono: 'folder',
              nOrden: 1,
              items: []
            },
            {
              cNombre: 'Ordenes de Trabajo',
              nCodigo: 21,
              nPadre: 2,
              cPath: '/procesos/ordentrabajo',
              path: '/procesos/ordentrabajo',
              icono: 'folder',
              nOrden: 1,
              items: []
            },
            {
              cNombre: 'Asignacion de Personal',
              nCodigo: 22,
              nPadre: 2,
              cPath: '/mantenimiento/personal/personalHorario',
              path: '/mantenimiento/personal/personalHorario',
              icono: 'group',
              nOrden: 2,
              items: []
            },
            {
              cNombre: 'Marcacion',
              nCodigo: 23,
              nPadre: 2,
              cPath: '/procesos/marcacion',
              path: '/procesos/marcacion',
              icono: 'check',
              nOrden: 3,
              items: []
            }
          ]
        },
        // Menú Mis Marcaciones
        {
          cNombre: 'Mis Marcaciones',
          nCodigo: 3,
          nPadre: 0,
          cPath: '/general/mismarcaciones',
          path: '/general/mismarcaciones',
          icono: 'event',
          nOrden: 3,
          items: []
        },
        // Menú de Usuario (al final)
        {
          cNombre: this.claims.cUsuario || 'Usuario',
          nCodigo: 990,
          nPadre: 0,
          nOrden: 999,
          cPath: '#',
          path: '#',
          cssClass: 'logout-item',
          icono: 'user',
          items: [
            {
              cNombre: 'Cerrar Sesión',
              nCodigo: 999,
              nPadre: 990,
              nOrden: 1000,
              cPath: '#',
              path: '#',
              icono: 'logout',
              items: []
            }
          ]
        }
      ];

      console.log('MenuBar completo creado:', this.menuBar);
    }
  }

  async traerUsuariosEmpresas() {
    console.log("traer usuarios empresas");

    // Si es usuario tipo U, no cargar empresas
    if (this.esUsuarioDocumento) {
      console.log('Usuario tipo U: No se cargan empresas');
      return;
    }

    try {
      const userId = localStorage.getItem('user_id');

      if (!userId) {
        console.error('No se encontró user_id en localStorage');
        return;
      }

      console.log('Cargando empresas para el usuario:', userId);

      const obser = this.apiService.listarUsuarioEmpresaPorUsuario(Number(userId));
      const result = await firstValueFrom(obser);

      this.usuariosEmpresas = result;

      console.log('Usuarios Empresas cargados:', this.usuariosEmpresas);
      console.log('Total de empresas disponibles:', this.usuariosEmpresas.length);

      // Verificar si hay una empresa guardada en localStorage
      const empresaGuardada = localStorage.getItem('empresa_id');
      if (empresaGuardada) {
        this.empresaSeleccionada = Number(empresaGuardada);
        console.log('Empresa cargada desde localStorage:', this.empresaSeleccionada);
      }

      setTimeout(() => {
        this.isInitialLoad = false;
      }, 100);

    } catch (error) {
      console.error('Error trayendo los usuarios empresas:', error);
    }
  }

  async onEmpresaChange(event: any) {
    if (this.isInitialLoad) {
      console.log('Ignorando cambio inicial de empresa');
      return;
    }
    if (!event.value) {
      console.log('No hay valor seleccionado');
      return;
    }
  
    console.log('Empresa cambiada - Nuevo valor:', event.value);
    
    this.blockUI.start('Cambiando empresa...');
    
    try {
      const empresaSeleccionadaObj = this.usuariosEmpresas.find(ue => ue.empresaId === event.value);
      
      if (!empresaSeleccionadaObj) {
        console.error('No se encontró la empresa seleccionada');
        this.mostrarError('No se encontró la empresa seleccionada');
        this.blockUI.stop();
        return;
      }
  
      console.log('Cambiando a empresa:', empresaSeleccionadaObj.empresa.nombre);
  
      localStorage.setItem('empresa_id', event.value.toString());
      console.log('Empresa ID guardado en localStorage:', event.value);
  
      const email = empresaSeleccionadaObj.usuario?.email || 
                    localStorage.getItem('user_email') || 
                    this.claims.email || 
                    this.claims.cEmail;
  
      if (!email) {
        console.error('No se pudo obtener el email del usuario');
        this.mostrarError('No se pudo obtener el email del usuario');
        this.blockUI.stop();
        return;
      }
  
      const body = {
        email: email,
        empresaId: event.value
      };
  
      console.log('Enviando body al API changeTenant:', body);
  
      const result = await firstValueFrom(this.apiService.changeTenant(body));
  
      console.log('Respuesta del API changeTenant:', result);
  
      if (result && result.accessToken) {
        localStorage.setItem('auth_token', result.accessToken);
        
        console.log('Token actualizado correctamente');
        console.log('Nueva empresa:', empresaSeleccionadaObj.empresa.nombre);
  
        this.empresaSeleccionada = event.value;
  
        this.mostrarMensaje(
          `Cambiando a empresa: ${empresaSeleccionadaObj.empresa.nombre}`, 
          'success'
        );
  
        setTimeout(() => {
          window.location.reload();
        }, 800);
  
      } else {
        console.error('No se recibió un token válido del API');
        this.mostrarError('No se recibió un token válido del servidor');
        this.empresaSeleccionada = null;
        localStorage.removeItem('empresa_id');
      }
  
    } catch (error: any) {
      console.error('Error al cambiar de empresa:', error);
      
      const mensajeError = error?.error?.message || 
                          error?.message || 
                          'Error desconocido al cambiar de empresa';
      this.mostrarError(mensajeError);
      
      this.empresaSeleccionada = null;
      localStorage.removeItem('empresa_id');
    } finally {
      this.blockUI.stop();
    }
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error') {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    alert(mensaje);
  }

  private mostrarError(mensaje: string) {
    this.mostrarMensaje(mensaje, 'error');
  }

  onLogout() {
    this.authService.logout();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkIfMobile();
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  onMenuItemClick(event: any) {
    console.log('Menu item clicked:', event);

    if (event.itemData.nCodigo === 999) {
      this.onLogout();
      window.location.reload();
    } else {
      const path = event.itemData.path;
      if (path && path !== '#') {
        console.log('Navegando a:', path);
        this.router.navigate([path]);
      }
    }
  }
}