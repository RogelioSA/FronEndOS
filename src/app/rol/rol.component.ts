import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
  selector: 'app-rol',
  templateUrl: './rol.component.html',
  styleUrl: './rol.component.css'
})
export class RolComponent implements OnInit {

  roles : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerRoles();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

    // this.apiService.getRoles().subscribe(
    //   response => {
    //     if (response.data) {
    //       this.roles = response.data;
    //       console.log('imprimiendo roles', response);
    //     } else {
    //       console.error('API error:', response.message);
    //     }
    //   },
    //   error => {
    //     console.error('Error connecting to the API:', error);
    //   }
    // );

  }

  async traerRoles(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer roles");

    try{
      const obser = this.apiService.getRoles();
      const result = await firstValueFrom(obser);

      this.roles = result.data;
    }catch(error){
      console.log('Error traendo los roles.')
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

    this.apiService.sincronizarRol(registro).subscribe(
      (response: any) => {
        this.traerRoles();
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
      cDetalle: event.data.cDetalle,
      cEstado: event.data.cEstado,
      cTipo: "insertar"
    }

    this.apiService.sincronizarRol(registro).subscribe(
      (response: any) => {
        this.traerRoles();
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

    this.apiService.sincronizarRol(registro).subscribe(
      (response: any) => {
        this.traerRoles();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }

}
