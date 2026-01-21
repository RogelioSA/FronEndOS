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
    this.traerUsuarios();

    this.blockUI.stop();

  }

  async traerRoles() {
    console.log("traer roles");

    try {
      const obser = this.apiService.getRoles();
      const result = await firstValueFrom(obser);

      // Mapeamos la respuesta al formato que espera el grid
      this.roles = result.map((r: any) => ({
        nCodigo: r.id,            // id → nCodigo
        cNombre: r.name,          // name → cNombre
        cDetalle: r.normalizedName // normalizedName → cDetalle
      }));

      console.log("Roles mapeados:", this.roles);
    } catch (error) {
      console.log("Error trayendo los roles.", error);
    }
  }


  async traerUsuarios() {
    console.log("traer usuarios");

    try {
      const obser = this.apiService.listarUsuarioEmpresa();
      const result = await firstValueFrom(obser);

      this.usuarios = result.map((usuario: any) => ({
        nCodigo: usuario.id,
        nPadre: null,
        cUsuario: usuario.userName,
        cCorreo: usuario.email
      }));

      console.log(this.usuarios);
    } catch (error) {
      console.log('Error trayendo los usuarios.');
    }
  }

  async traerRolUsuario(rol : string){
    console.log("traer rolUsuarios");

    try{
      const obser = this.apiService.getRolUsuarios(rol);
      const result = await firstValueFrom(obser);

      const usuariosRol = Array.isArray(result) ? result : result?.data ?? [];

      this.rolUsuario = usuariosRol.map((usuario: any) => ({
        id: usuario.id,
        userName: usuario.userName,
        email: usuario.email
      }));

      const usuariosPorNombre = new Map(
        (this.usuarios as any[]).map((usuario: any) => [usuario.cUsuario, usuario.nCodigo])
      );

      this.filasSeleccionadasUsuario = this.rolUsuario
        .map((usuario: any) => usuariosPorNombre.get(usuario.userName))
        .filter((usuarioId: any) => usuarioId !== undefined && usuarioId !== null);
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
      this.blockUI.stop();
      return;
    }

    try{
      const roleName = (this.roles as any[]).find((rol: any) => rol.nCodigo === seleccionRol[0])?.cNombre;

      if (!roleName) {
        this.mensajeToast = 'No se pudo identificar el rol seleccionado';
        this.visibleToast = true;
        return;
      }

      const usuariosSeleccionados = (seleccionUsuario as any[]).map((usuarioId: any) => String(usuarioId));
      const obser = this.apiService.asignarRolUsuario(roleName, usuariosSeleccionados);
      const result = await firstValueFrom(obser);
      await this.traerRolUsuario(roleName);

    }catch(error){
      console.log('Error traendo los roles.')
    }finally{
      this.blockUI.stop();
    }
  }

  async onSelectionChangedGrid(event: any) {
    await this.traerRolUsuario(event.selectedRowsData[0].cNombre);
  }

  onSelectionChangedTree(event: any) {
    //console.log(this.filasSeleccionadasMenu);
  }

}
