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

  menus: any[] = [];
  menuBar: any[] = [];
  hijos: any[] = [];
  menu2: any[] = [];
  usuariosEmpresas: any[] = [];
  empresaSeleccionada: number | null = null; // ✅ Cambiado a null
  @BlockUI() blockUI!: NgBlockUI;

  menuOpen = false;
  isMobile = false;
  claims: any;
  private isInitialLoad = true; // ✅ Bandera para controlar la carga inicial

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.checkIfMobile();
  }

  async ngOnInit(): Promise<void> {
    this.claims = this.authService.getClaims();
    await this.traerUsuariosEmpresas();
    await this.traerMenus();
    this.armarArregloMenuBar();
  }

  async traerMenus() {
    this.blockUI.start('Cargando...'); 

    console.log("traer menus");

    try {
      const obser = this.apiService.getMenus();
      const result = await firstValueFrom(obser);

      this.menus = result.map((m: any) => ({
        cNombre: m.nombre,
        nCodigo: m.id,
        nPadre: m.parentId ?? 0,
        cPath: m.controlador && m.action ? `/${m.controlador}/${m.action}` : '#',
        nOrden: m.orden,
        items: m.children ?? [],
        migrado: false
      }));

      let usuario = {
        cNombre: this.claims.cUsuario,
        nCodigo: 990,
        nPadre: 0,
        nOrden: 999,
        cPath: '#',
        cssClass: 'logout-item',
        items: []
      };

      let cerrarSesion = {
        cNombre: 'Cerrar Sesión',
        nCodigo: 999,
        nPadre: 990,
        nOrden: 1000,
        cPath: '#',
        items: []
      };
      this.menus.push(usuario, cerrarSesion);

    } catch (error) {
      console.log('Error traendo los menus.')
    } finally {
      this.blockUI.stop();
    }
  }

  async traerUsuariosEmpresas() {
    console.log("traer usuarios empresas");

    try {
      // Obtener el user_id del localStorage
      const userId = localStorage.getItem('user_id');

      if (!userId) {
        console.error('No se encontró user_id en localStorage');
        return;
      }

      console.log('Cargando empresas para el usuario:', userId);

      // Llamar a la nueva API con el userId
      const obser = this.apiService.listarUsuarioEmpresaPorUsuario(Number(userId));
      const result = await firstValueFrom(obser);

      this.usuariosEmpresas = result;

      // ✅ NO asignar valor por defecto aquí
      // Solo cargar los datos, el usuario debe seleccionar manualmente
      console.log('Usuarios Empresas cargados:', this.usuariosEmpresas);
      console.log('Total de empresas disponibles:', this.usuariosEmpresas.length);

      // ✅ Marcar que la carga inicial ha terminado
      setTimeout(() => {
        this.isInitialLoad = false;
      }, 100);

    } catch (error) {
      console.error('Error trayendo los usuarios empresas:', error);
    }
  }

  async onEmpresaChange(event: any) {
    // ✅ Ignorar el primer cambio que ocurre al cargar
    if (this.isInitialLoad) {
      console.log('Ignorando cambio inicial de empresa');
      return;
    }

    // ✅ Validar que haya un valor seleccionado
    if (!event.value) {
      console.log('No hay valor seleccionado');
      return;
    }

    console.log('Empresa cambiada - Nuevo valor:', event.value);
    
    this.blockUI.start('Cambiando empresa...');
    
    try {
      // Buscar la empresa seleccionada en el array
      const empresaSeleccionadaObj = this.usuariosEmpresas.find(ue => ue.empresaId === event.value);
      
      if (!empresaSeleccionadaObj) {
        console.error('No se encontró la empresa seleccionada');
        this.mostrarError('No se encontró la empresa seleccionada');
        this.blockUI.stop();
        return;
      }
  
      console.log('Cambiando a empresa:', empresaSeleccionadaObj.empresa.nombre);
  
      // Obtener el email del usuario
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
  
      // Preparar el body para el API
      const body = {
        email: email,
        empresaId: event.value
      };
  
      console.log('Enviando body al API changeTenant:', body);
  
      // Llamar al API changeTenant
      const result = await firstValueFrom(this.apiService.changeTenant(body));
  
      console.log('Respuesta del API changeTenant:', result);
  
      // Verificar si el resultado tiene el token
      if (result && result.accessToken) {
        // Reemplazar el token en localStorage
        localStorage.setItem('auth_token', result.accessToken);
        
        console.log('Token actualizado correctamente');
        console.log('Nueva empresa:', empresaSeleccionadaObj.empresa.nombre);
  
        // Actualizar la empresa seleccionada
        this.empresaSeleccionada = event.value;
  
        // Mostrar mensaje de éxito con el nombre de la empresa
        this.mostrarMensaje(
          `Cambiando a empresa: ${empresaSeleccionadaObj.empresa.nombre}`, 
          'success'
        );
  
        // Recargar la página después de un breve delay
        setTimeout(() => {
          window.location.reload();
        }, 800);
  
      } else {
        console.error('No se recibió un token válido del API');
        this.mostrarError('No se recibió un token válido del servidor');
        this.empresaSeleccionada = null; // Resetear selección
      }
  
    } catch (error: any) {
      console.error('Error al cambiar de empresa:', error);
      
      const mensajeError = error?.error?.message || 
                          error?.message || 
                          'Error desconocido al cambiar de empresa';
      this.mostrarError(mensajeError);
      
      this.empresaSeleccionada = null; // Resetear selección en caso de error
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
    console.log(event);

    if (event.itemData.nCodigo === 999) {
      this.onLogout();
      window.location.reload();
    } else {
      const path = event.itemData.path;
      if (path !== '#')
        this.router.navigate([path]);
    }
  }

  armarArregloMenuBar() {
    for (var a = 0; a < this.menus.length; a++) {
      this.menus[a].items = [];
      this.menus[a].migrado = false;
      this.menus[a].path = this.menus[a].cPath;

      if (this.menus[a].nPadre === 0) {
        this.menuBar[this.menus[a].nOrden] = this.menus[a];
        this.menus[a].migrado = true;
        this.menu2[this.menus[a].nOrden] = this.menus[a];
      } else {
        this.hijos.push(this.menus[a]);
      }
    }

    this.menuBar = this.menuBar.filter((m) => m !== undefined);

    for (var b = 0; b < this.hijos.length; b++) {
      for (var c = 0; c < this.hijos.length; c++) {
        if (b !== c) {
          if (this.hijos[b].nPadre === this.hijos[c].nCodigo) {
            this.hijos[c].items.push(this.hijos[b]);
          }
        }
      }
    }

    for (var d = 0; d < this.menuBar.length; d++) {
      for (var e = 0; e < this.hijos.length; e++) {
        if (this.menuBar[d].nCodigo === this.hijos[e].nPadre) {
          this.menuBar[d].items.push(this.hijos[e]);
        }
      }
    }
  }
}