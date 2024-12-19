import { Component, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DxTreeListComponent } from 'devextreme-angular';

@Component({
  selector: 'app-rol-menu',
  templateUrl: './rol-menu.component.html',
  styleUrl: './rol-menu.component.css'
})
export class RolMenuComponent {

  roles : [] = [];
  menus : [] = [];
  rolMenus : [] = [];
  filasSeleccionadasMenu : any;
  filasSeleccionadasRol : any;

  visibleToast : boolean = false;
  mensajeToast : string = "";

  @BlockUI() blockUI!: NgBlockUI;
  @ViewChild('treeList', { static: false }) treeList!: DxTreeListComponent;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.blockUI.start('Cargando...'); // Start blocking

    this.traerRoles();
    this.traerMenu();

    this.blockUI.stop();

  }

  async traerRoles(){
    console.log("traer roles");

    try{
      const obser = this.apiService.getRoles();
      const result = await firstValueFrom(obser);

      this.roles = result.data;
    }catch(error){
      console.log('Error traendo los roles.')
    }finally{ 
    }
  }

  async traerMenu(){
    console.log("traer menus");

    try{
      const obser = this.apiService.getMenus();
      const result = await firstValueFrom(obser);

      this.menus = result.data;
    }catch(error){
      console.log('Error traendo los menus.')
    }finally{
    }
  }

  async traerRolMenu(rol : number){
    console.log("traer rolMenus");

    try{
      const obser = this.apiService.getRolMenus(rol);
      const result = await firstValueFrom(obser);

      this.filasSeleccionadasMenu = result.data;
    }catch(error){
      console.log('Error traendo los rolMenus.')
    }finally{
    }
  }

  async guardarCambios(){

    this.blockUI.start('Guardando...');

    let seleccionMenu = this.treeList.instance.getSelectedRowKeys('all');
    let seleccionRol = this.filasSeleccionadasRol;

    if (seleccionMenu.length === 0 || seleccionRol === undefined){
      this.mensajeToast = 'Se debe seleccionar opciones para configurar';
      this.visibleToast = true;
      this.blockUI.stop();
      return;
    }

    try{
      const obser = this.apiService.sincronizarRolMenu(seleccionRol[0],seleccionMenu);
      const result = await firstValueFrom(obser);
      await this.traerRolMenu(seleccionRol[0]);

    }catch(error){
      console.log('Error traendo los roles.')
    }finally{ 
      this.blockUI.stop();
    }
  }

  async onSelectionChangedGrid(event: any) {
    await this.traerRolMenu(event.selectedRowsData[0].nCodigo);
  }
  
  onSelectionChangedTree(event: any) {
    //console.log(this.filasSeleccionadasMenu);
  }

}
