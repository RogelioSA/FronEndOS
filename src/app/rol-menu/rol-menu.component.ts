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
    this.blockUI.start('Guardando...');

    let seleccionMenu = this.treeList.instance.getSelectedRowKeys('all');
    let seleccionRol = this.filasSeleccionadasRol;

    if (seleccionMenu.length === 0 || seleccionRol === undefined) {
      this.mensajeToast = 'Se debe seleccionar opciones para configurar';
      this.tipoToast = 'error';
      this.visibleToast = true;
      this.blockUI.stop();
      return;
    }

    try {
      const idsSeleccionados = seleccionMenu;
      
      console.log('Guardando menús seleccionados:', idsSeleccionados);

      // Filtrar promesas válidas (cuando menuCompleto existe)
      const promises = idsSeleccionados
        .map((menuId: number) => {
          const menuCompleto: any = this.menus.find((m: any) => m.nCodigo === menuId);
          
          if (menuCompleto && menuCompleto.datosCompletos) {
            const datos = menuCompleto.datosCompletos;
            
            const data = {
              id: menuId, // AGREGADO: id es requerido en el body
              parentId: datos.parentId || 0,
              moduloId: datos.moduloId || 0,
              nombre: datos.nombre || '',
              nombreCorto: datos.nombreCorto || '',
              descripcion: datos.descripcion || '',
              controlador: datos.controlador || '',
              action: datos.action || '',
              icono: datos.icono || '',
              claimType: datos.claimType || '',
              orden: datos.orden || 0,
              estado: datos.estado ?? true
            };

            return firstValueFrom(this.apiService.actualizarMenu(menuId, data));
          }
          return null; // Retornar null si no hay datos
        })
        .filter(p => p !== null); // Filtrar nulls

      await Promise.all(promises);
      
      this.mensajeToast = 'Cambios guardados exitosamente';
      this.tipoToast = 'success';
      this.visibleToast = true;
      
      await this.traerRolMenu(seleccionRol[0].toString());

    } catch (error) {
      console.log('Error guardando cambios.', error);
      this.mensajeToast = 'Error al guardar los cambios';
      this.tipoToast = 'error';
      this.visibleToast = true;
    } finally { 
      this.blockUI.stop();
    }
  }

  async onSelectionChangedGrid(event: any) {
    if (event.selectedRowsData && event.selectedRowsData.length > 0) {
      const rolId = event.selectedRowsData[0].nCodigo.toString();
      await this.traerRolMenu(rolId);
    } else {
      this.filasSeleccionadasMenu = [];
    }
  }
  
  onSelectionChangedTree(event: any) {
    console.log("Selección actual del árbol:", this.filasSeleccionadasMenu);
  }
}