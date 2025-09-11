import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DxTreeListTypes } from 'devextreme-angular/ui/tree-list';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.css',
    standalone: false
})
export class MenuComponent {

  menus : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerMenus();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

  }

  async traerMenus(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer menus");

    try{
      const obser = this.apiService.getMenus();
      const result = await firstValueFrom(obser);

      this.menus = result.data;
    }catch(error){
      console.log('Error traendo los menus.')
    }finally{
      this.blockUI.stop();
    }
  }

  guardar(event : any){
    console.log(event);
  }

  actualizar(event : any){

    let registro = event.newData;
    registro.nCodigo = event.oldData.nCodigo;
    registro.cTipo = "actualizar";

    this.apiService.sincronizarMenu(registro).subscribe(
      (response: any) => {
        this.traerMenus();
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
  }

  insertar(event : any){

    let registro = {
      cNombre: event.data.cNombre,
      cNombreMostrar: event.data.cNombreMostrar,
      cDetalle: event.data.cDetalle,
      cIcono: event.data.cIcono === undefined ? '' : event.data.cIcono,
      cPath: event.data.cPath,
      nOrden: event.data.nOrden,
      nPadre: event.data.nPadre,
      cTipo: "insertar"
    }

    this.apiService.sincronizarMenu(registro).subscribe(
      (response: any) => {
        this.traerMenus();
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
  }

  eliminar(event : any){
    let registro = {
      nCodigo : event.data.nCodigo,
      cTipo : "eliminar"
    };

    this.apiService.sincronizarMenu(registro).subscribe(
      (response: any) => {
        this.traerMenus();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }

  initNewRow(e: DxTreeListTypes.InitNewRowEvent) {
    // e.data.Task_Status = 'Not Started';
    // e.data.Task_Start_Date = new Date();
    // e.data.Task_Due_Date = new Date();
    console.log("agregando fila",e)
  }

}
