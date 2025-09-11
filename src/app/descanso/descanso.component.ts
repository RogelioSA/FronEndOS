import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-descanso',
    templateUrl: './descanso.component.html',
    styleUrl: './descanso.component.css',
    standalone: false
})
export class DescansoComponent {

  descansos : [] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    await this.traerDescansos();

  }

  async traerDescansos(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer descansos");

    try{
      const obser = this.apiService.getDescansos();
      const result = await firstValueFrom(obser);

      this.descansos = result.data;
    }catch(error){
      console.log('Error traendo los descansos.')
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

    this.apiService.sincronizarDescanso(registro).subscribe(
      (response: any) => {
        this.traerDescansos();
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
      cHoraInicial: event.data.cHoraInicial,
      cHoraFinal: event.data.cHoraFinal,
      nDuracion: event.data.nDuracion,
      cTipo: "insertar"
    }

    this.apiService.sincronizarDescanso(registro).subscribe(
      (response: any) => {
        this.traerDescansos();
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

    this.apiService.sincronizarDescanso(registro).subscribe(
      (response: any) => {
        this.traerDescansos();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }

}
