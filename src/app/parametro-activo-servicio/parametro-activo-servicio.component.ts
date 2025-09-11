import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-parametro-activo-servicio',
    templateUrl: './parametro-activo-servicio.component.html',
    styleUrl: './parametro-activo-servicio.component.css',
    standalone: false
})
export class ParametroActivoServicioComponent {

  parametros : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  username: string | undefined;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerDepartamentos();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

  }

  async traerDepartamentos(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer departamentos");

    try{
      const obser = this.apiService.getDepartamentos();
      const result = await firstValueFrom(obser);

      this.parametros = result.data;
    }catch(error){
      console.log('Error traendo los departamentos.')
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

    const { newData, oldData } = event;

    // try{
    //   const obser = this.apiService.sincronizarDepartamento(registro);
    //   const result = await firstValueFrom(obser);
    // }catch(error){
    //   event.component.cancelEditData();
    //   event.cancel = true;
    //   this.showMessage('Error al actualizar registro.');
    //   console.error('Error al actualizar registro.', error);
    // }

    this.apiService.sincronizarDepartamento(registro).subscribe(
      (response: any) => {
        this.traerDepartamentos();
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
  }

  async insertar(event : any){

    let registro = {
      cNombre: event.data.cNombre,
      cDetalle: event.data.cDetalle,
      cTipo: "insertar"
    }

    await this.apiService.sincronizarDepartamento(registro).subscribe(
      (response: any) => {
        this.traerDepartamentos();
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

    this.apiService.sincronizarDepartamento(registro).subscribe(
      (response: any) => {
        this.traerDepartamentos();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }

  showMessage(message: string) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
      messageBox.innerText = message;
      messageBox.style.display = 'block';
      setTimeout(() => {
        messageBox.style.display = 'none';
      }, 3000); // Ocultar el mensaje después de 3 segundos
    }
  }

}
