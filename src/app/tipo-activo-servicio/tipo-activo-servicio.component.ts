import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
  selector: 'app-tipo-activo-servicio',
  templateUrl: './tipo-activo-servicio.component.html',
  styleUrl: './tipo-activo-servicio.component.css'
})
export class TipoActivoServicioComponent {

  tipos : [] = [];
  parametros : [] = [];
  estados : any[] = [];
  filasSeleccionadasTipo: any[] = [];

  tiposDeDato: any[] = [];

  @BlockUI() blockUI!: NgBlockUI;

  username: string | undefined;
  activarAgregarParametros: boolean = false;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.tiposDeDato = [
                        {Codigo:'int', Nombre: 'Numero entero'},
                        {Codigo: 'float', Nombre: 'Numero decimal'},
                        {Codigo: 'string', Nombre: 'Texto'}
                      ];

    this.traerTiposActivo();

  }

  async traerTiposActivo(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer tipos");

    try{
      const obser = this.apiService.getTiposActivo();
      const result = await firstValueFrom(obser);

      this.tipos = result.data;
    }catch(error){
      console.log('Error traendo los tipos.')
    }finally{
      this.blockUI.stop();
    }
  }

  async traerParametrosActivo(tipoActivo: number){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer parametros");

    try{
      const obser = this.apiService.getParametrosActivo(tipoActivo);
      const result = await firstValueFrom(obser);

      this.parametros = result.data;
    }catch(error){
      console.log('Error traendo los parametros.')
    }finally{
      this.blockUI.stop();
    }
  }

  guardar(event : any){
    console.log(event);
  }

  actualizarTipo(event : any){

    let registro = event.newData;
    registro.nCodigo = event.oldData.nCodigo;
    registro.cTipo = "actualizar";

    this.apiService.sincronizarTipoActivo(registro).subscribe(
      (response: any) => {
        this.traerTiposActivo();
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
  }

  async insertarTipo(event : any){

    let registro = {
      cNombre: event.data.cNombre,
      cTipo: "insertar"
    }

    await this.apiService.sincronizarTipoActivo(registro).subscribe(
      (response: any) => {
        this.traerTiposActivo();
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
  }

  eliminarTipo(event : any){
    let registro = {
      nCodigo : event.data.nCodigo,
      cTipo : "eliminar"
    };

    this.apiService.sincronizarTipoActivo(registro).subscribe(
      (response: any) => {
        this.traerTiposActivo();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
    
  }

  onSelectionChangedGrid(event: any){

    if(this.filasSeleccionadasTipo.length > 0){
      this.activarAgregarParametros = true;
    }else{
      this.activarAgregarParametros = false;
    }

    if(this.filasSeleccionadasTipo[0] !== undefined){
      this.traerParametrosActivo(this.filasSeleccionadasTipo[0]);
    }else{
      this.parametros = [];
    }

  }

  actualizarParametro(event : any){

    let registro = event.newData;
    registro.nCodigo = event.oldData.nCodigo;
    registro.cTipo = "actualizar";

    this.apiService.sincronizarParametroActivo(registro).subscribe(
      (response: any) => {
        this.traerParametrosActivo(this.filasSeleccionadasTipo[0]);
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
  }

  async insertarParametro(event : any){

    let registro = {
      cNombre: event.data.cNombre,
      cTipoDato: event.data.cTipoDato,
      nTipoActivoServicio: this.filasSeleccionadasTipo[0],
      cTipo: "insertar"
    }

    await this.apiService.sincronizarParametroActivo(registro).subscribe(
      (response: any) => {
        this.traerParametrosActivo(this.filasSeleccionadasTipo[0]);
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
  }

  eliminarParametro(event : any){
    let registro = {
      nCodigo : event.data.nCodigo,
      cTipo : "eliminar"
    };

    this.apiService.sincronizarParametroActivo(registro).subscribe(
      (response: any) => {
        this.traerParametrosActivo(this.filasSeleccionadasTipo[0]);
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
    
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
