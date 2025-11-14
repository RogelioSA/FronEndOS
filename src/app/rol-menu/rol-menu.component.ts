import { Component, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DxTreeListComponent } from 'devextreme-angular';

@Component({
    selector: 'app-rol-menu',
    templateUrl: './rol-menu.component.html',
    styleUrl: './rol-menu.component.css',
    standalone: false
})
export class RolMenuComponent {

  roles : [] = [];
  menus : [] = [];
  rolMenus : [] = [];
  filasSeleccionadasMenu : any[] = [];
  filasSeleccionadasRol : any;
  rolSeleccionadoId: string | null = null; // Nueva propiedad para guardar el rol actual

  visibleToast : boolean = false;
  mensajeToast : string = "";
  tipoToast : string = "error";

  @BlockUI() blockUI!: NgBlockUI;
  @ViewChild('treeList', { static: false }) treeList!: DxTreeListComponent;

  constructor(private apiService: ApiService){}

  async ngOnInit():Promise<void> {
    this.blockUI.start('Cargando...'); 
    await this.traerRoles();
    await this.traerMenu();
    this.blockUI.stop();
  }

  async traerRoles() {
    console.log("traer roles");
    try {
      const obser = this.apiService.getRoles();
      const result = await firstValueFrom(obser);
  
      this.roles = result.map((r: any) => ({
        nCodigo: r.id,
        cNombre: r.name,
        cDetalle: r.normalizedName
      }));
  
      console.log("Roles mapeados:", this.roles);
    } catch (error) {
      console.log("Error trayendo los roles.", error);
    }
  }

  async traerMenu() {
    console.log("traer menus");
    try {
      const obser = this.apiService.getMenus();
      const result = await firstValueFrom(obser);
  
      this.menus = result.map((m: any) => ({
        nCodigo: m.id,
        nPadre: m.parentId,
        cNombre: m.nombre,
        cNombreMostrar: m.nombreCorto,
        datosCompletos: m
      }));
  
      console.log("Menus mapeados:", this.menus);
    } catch (error) {
      console.log("Error trayendo los menus.", error);
    }
  }

  async traerRolMenu(rolId: string) {
    console.log("traer rolMenus para rol:", rolId);
    
    // Guardar el rol actual
    this.rolSeleccionadoId = rolId;
    
    try {
      const obser = this.apiService.obtenerFormulariosPorRol(rolId);
      const result = await firstValueFrom(obser);

      this.filasSeleccionadasMenu = result.map((formulario: any) => formulario.id);
      
      console.log("Formularios seleccionados:", this.filasSeleccionadasMenu);
    } catch (error) {
      console.log('Error trayendo los rolMenus.', error);
      this.filasSeleccionadasMenu = [];
    }
  }

  async guardarCambios() {
    await this.sincronizarPermisos();
  }

  async onSelectionChangedGrid(event: any) {
    if (event.selectedRowsData && event.selectedRowsData.length > 0) {
      const rolId = event.selectedRowsData[0].nCodigo.toString();
      await this.traerRolMenu(rolId);
    } else {
      this.filasSeleccionadasMenu = [];
      this.rolSeleccionadoId = null; // Limpiar rol seleccionado
    }
  }
  
  async onSelectionChangedTree(event: any) {
    console.log("🔄 Cambio en selección del árbol");
    console.log("Selección actual del árbol:", this.filasSeleccionadasMenu);
    
    // Solo actualizar el estado local, NO sincronizar con el servidor
    // La sincronización se hará cuando el usuario presione "Guardar"
  }

  async sincronizarPermisos() {
    if (!this.rolSeleccionadoId) {
      this.mensajeToast = 'Debe seleccionar un rol';
      this.tipoToast = 'error';
      this.visibleToast = true;
      return;
    }
  
    try {
      this.blockUI.start('Sincronizando permisos...');
      
      const roleId = this.rolSeleccionadoId;
      const seleccionMenu = this.treeList.instance.getSelectedRowKeys('all');
      
      console.log('🔐 Sincronizando permisos para rol:', roleId);
      console.log('📋 Menús seleccionados:', seleccionMenu);
  
      const claims = seleccionMenu.map((menuId: any) => {
        const menu = (this.menus as any[]).find((m: any) => m.nCodigo === menuId);
        const claimType = menu?.datosCompletos?.claimType || `menu_${menuId}`;
        
        return {
          type: claimType,
          value: "true" // CAMBIO: string en lugar de boolean
        };
      });
  
      console.log('📤 Enviando claims al servidor:', claims);
  
      await firstValueFrom(
        this.apiService.sincronizarRolClaim(roleId, claims)
      );
      
      this.mensajeToast = 'Permisos sincronizados correctamente';
      this.tipoToast = 'success';
      this.visibleToast = true;
  
      console.log('✅ Sincronización completada');
  
    } catch (error: any) {
      console.error('❌ Error sincronizando permisos:', error);
      
      const mensajeError = error?.error?.message || 
                          error?.message || 
                          'Error al sincronizar los permisos';
      
      this.mensajeToast = mensajeError;
      this.tipoToast = 'error';
      this.visibleToast = true;
    } finally { 
      this.blockUI.stop();
    }
  }
}