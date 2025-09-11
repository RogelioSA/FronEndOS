import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-personal-situacion',
    templateUrl: './personal-situacion.component.html',
    styleUrl: './personal-situacion.component.css',
    standalone: false
})
export class PersonalSituacionComponent {

  situaciones : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}
  
  async ngOnInit():Promise<void> {

    this.traerSituaciones();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

  }

  async traerSituaciones(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer situaciones");

    try{
      const obser = this.apiService.getPersonalSituaciones();
      const result = await firstValueFrom(obser);

      this.situaciones = result.data;
    }catch(error){
      console.log('Error traendo las situaciones.')
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

    this.apiService.sincronizarPersonalSituacion(registro).subscribe(
      (response: any) => {
        this.traerSituaciones();
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
      cAbreviacion: event.data.cAbreviacion,
      cDetalle: event.data.cDetalle,
      cTipo: "insertar"
    }

    this.apiService.sincronizarPersonalSituacion(registro).subscribe(
      (response: any) => {
        this.traerSituaciones();
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

    this.apiService.sincronizarPersonalSituacion(registro).subscribe(
      (response: any) => {
        this.traerSituaciones();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }

}
