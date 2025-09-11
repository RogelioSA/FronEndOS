import { Component, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DxTreeListComponent } from 'devextreme-angular';

@Component({
    selector: 'app-rol-usuario',
    templateUrl: './rol-usuario.component.html',
    styleUrl: './rol-usuario.component.css',
    standalone: false
})
export class RolUsuarioComponent {

  roles : [] = [];
  usuarios : [] = [];
  rolUsuario : [] = [];
  filasSeleccionadasUsuario : any;
  filasSeleccionadasRol : any;

  visibleToast : boolean = false;
  mensajeToast : string = "";

  @BlockUI() blockUI!: NgBlockUI;
  @ViewChild('treeList', { static: false }) treeList!: DxTreeListComponent;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.blockUI.start('Cargando...'); // Start blocking

    this.traerRoles();
    this.traerPersonal();

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

  async traerPersonal(){
    console.log("traer personal");

    try{
      const obser = this.apiService.getPersonal();
      const result = await firstValueFrom(obser);

      this.usuarios = result.data;

      console.log(this.usuarios);
    }catch(error){
      console.log('Error traendo el personal.')
    }finally{
    }
  }

  async traerRolUsuario(rol : number){
    console.log("traer rolUsuarios");

    try{
      const obser = this.apiService.getRolUsuarios(rol);
      const result = await firstValueFrom(obser);

      this.filasSeleccionadasUsuario = result.data;
    }catch(error){
      console.log('Error traendo los rolUsuarios.')
    }finally{
    }
  }

  async guardarCambios(){

    this.blockUI.start('Guardando...');

    let seleccionUsuario = this.treeList.instance.getSelectedRowKeys('all');
    let seleccionRol = this.filasSeleccionadasRol;

    if (seleccionUsuario.length === 0 || seleccionRol === undefined){
      this.mensajeToast = 'Se debe seleccionar opciones para configurar';
      this.visibleToast = true;
      return;
    }

    try{
      const obser = this.apiService.sincronizarRolUsuario(seleccionRol[0],seleccionUsuario);
      const result = await firstValueFrom(obser);
      await this.traerRolUsuario(seleccionRol[0]);

    }catch(error){
      console.log('Error traendo los roles.')
    }finally{ 
      this.blockUI.stop();
    }
  }

  async onSelectionChangedGrid(event: any) {
    await this.traerRolUsuario(event.selectedRowsData[0].nCodigo);
  }
  
  onSelectionChangedTree(event: any) {
    //console.log(this.filasSeleccionadasMenu);
  }

}
