import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-contrato-tipo',
    templateUrl: './contrato-tipo.component.html',
    styleUrl: './contrato-tipo.component.css',
    standalone: false
})
export class ContratoTipoComponent {

  contratoTipos : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerContratoTipos();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

  }

  async traerContratoTipos(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer tipos");

    try{
      const obser = this.apiService.getContratoTipos();
      const result = await firstValueFrom(obser);

      this.contratoTipos = result.data;
    }catch(error){
      console.log('Error traendo los tipos.')
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

    this.apiService.sincronizarContratoTipo(registro).subscribe(
      (response: any) => {
        this.traerContratoTipos();
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
      cTipo: "insertar"
    }

    this.apiService.sincronizarContratoTipo(registro).subscribe(
      (response: any) => {
        this.traerContratoTipos();
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

    this.apiService.sincronizarContratoTipo(registro).subscribe(
      (response: any) => {
        this.traerContratoTipos();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }

}
