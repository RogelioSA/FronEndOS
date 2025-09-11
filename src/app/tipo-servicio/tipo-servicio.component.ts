import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-tipo-servicio',
    templateUrl: './tipo-servicio.component.html',
    styleUrl: './tipo-servicio.component.css',
    standalone: false
})
export class TipoServicioComponent {

  tipos : [] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    await this.traerTipos();

  }

  async traerTipos(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer tipos");

    try{
      const obser = this.apiService.getTiposServicio();
      const result = await firstValueFrom(obser);

      this.tipos = result.data;
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

    this.apiService.sincronizarTipoServicio(registro).subscribe(
      (response: any) => {
        this.traerTipos();
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
      nDepartamento: event.data.nDepartamento,
      cTipo: "insertar"
    }

    this.apiService.sincronizarTipoServicio(registro).subscribe(
      (response: any) => {
        this.traerTipos();
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

    this.apiService.sincronizarTipoServicio(registro).subscribe(
      (response: any) => {
        this.traerTipos();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }

}
