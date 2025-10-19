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
  empresaSeleccionada: number = 0;
  @BlockUI() blockUI!: NgBlockUI;

  menuOpen = false;
  isMobile = false;
  claims: any;

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
    this.blockUI.start('Cargando...'); // Start blocking

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
      const obser = this.apiService.getUsuariosEmpresa();
      const result = await firstValueFrom(obser);

      this.usuariosEmpresas = result;

      // Buscar la empresa marcada como "actual"
      const empresaActual = this.usuariosEmpresas.find(ue => ue.actual === true);
      
      if (empresaActual) {
        this.empresaSeleccionada = empresaActual.empresaId;
      } else if (this.usuariosEmpresas.length > 0) {
        // Si no hay ninguna marcada como actual, seleccionar la primera
        this.empresaSeleccionada = this.usuariosEmpresas[0].empresaId;
      }

      console.log('Usuarios Empresas cargados:', this.usuariosEmpresas);
      console.log('Empresa seleccionada:', this.empresaSeleccionada);

    } catch (error) {
      console.log('Error trayendo los usuarios empresas.', error);
    }
  }

  async onEmpresaChange(event: any) {
    console.log('Empresa cambiada:', event.value);
    
    this.blockUI.start('Cambiando empresa...');
    
    try {
      // Buscar la empresa seleccionada en el array
      const empresaSeleccionadaObj = this.usuariosEmpresas.find(ue => ue.empresaId === event.value);
      
      if (!empresaSeleccionadaObj) {
        console.error('No se encontró la empresa seleccionada');
        return;
      }

      // Obtener el email del usuario
      const email = empresaSeleccionadaObj.usuario?.email || this.claims.email;

      if (!email) {
        console.error('No se pudo obtener el email del usuario');
        return;
      }

      // Preparar el body para el API
      const body = {
        email: email,
        empresaId: event.value
      };

      console.log('Enviando body:', body);

      // Llamar al API changeTenant
      const result = await firstValueFrom(this.apiService.changeTenant(body));

      console.log('Respuesta del API:', result);

      // Verificar si el resultado tiene el token
      if (result && result.token) {
        // Reemplazar el token en localStorage
        localStorage.setItem('auth_token', result.token);
        
        console.log('Token actualizado correctamente');

        // Actualizar la empresa seleccionada
        this.empresaSeleccionada = event.value;

        // Recargar la página para aplicar los cambios con el nuevo token
        window.location.reload();

      } else {
        console.error('No se recibió un token válido del API');
      }

    } catch (error) {
      console.error('Error al cambiar de empresa:', error);
      // Revertir la selección en caso de error
      const empresaActual = this.usuariosEmpresas.find(ue => ue.actual === true);
      if (empresaActual) {
        this.empresaSeleccionada = empresaActual.empresaId;
      }
    } finally {
      this.blockUI.stop();
    }
  }

  onLogout() {
    this.authService.logout();
  }

  // Detectar si el tamaño de la pantalla es móvil
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
      else {

      }
    }
  }

  armarArregloMenuBar() {

    for (var a = 0; a < this.menus.length; a++) {

      this.menus[a].items = [];
      this.menus[a].migrado = false;
      this.menus[a].path = this.menus[a].cPath;

      if (this.menus[a].nPadre === 0) {
        //this.menuBar.push(this.menus[a]);
        this.menuBar[this.menus[a].nOrden] = this.menus[a];
        this.menus[a].migrado = true;

        this.menu2[this.menus[a].nOrden] = this.menus[a];
      } else {
        this.hijos.push(this.menus[a]);
      }
    }

    //filtro para limpiar todos los elementos que quedan vacios por el nOrden
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