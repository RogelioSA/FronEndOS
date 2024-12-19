import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
  selector: 'app-marca',
  templateUrl: './marca.component.html',
  styleUrl: './marca.component.css'
})
export class MarcaComponent {

  marcas : [] = [];
  modelos : [] = [];
  estados : any[] = [];
  filasSeleccionadasMarca: any[] = [];

  tiposDeDato: any[] = [];

  @BlockUI() blockUI!: NgBlockUI;

  username: string | undefined;
  activarAgregarModelos: boolean = false;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerMarcasActivo();

  }

  async traerMarcasActivo(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer marcas");

    try{
      const obser = this.apiService.getMarcasActivo();
      const result = await firstValueFrom(obser);

      this.marcas = result.data;
    }catch(error){
      console.log('Error traendo las marcas.')
    }finally{
      this.blockUI.stop();
    }
  }

  async traerModelosActivo(tipoActivo: number){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer modelos");

    try{
      const obser = this.apiService.getModelosActivo(tipoActivo);
      const result = await firstValueFrom(obser);

      this.modelos = result.data;
    }catch(error){
      console.log('Error traendo los modelos.')
    }finally{
      this.blockUI.stop();
    }
  }

  guardar(event : any){
    console.log(event);
  }

  actualizarMarca(event : any){

    let registro = event.newData;
    registro.nCodigo = event.oldData.nCodigo;
    registro.cTipo = "actualizar";

    this.apiService.sincronizarMarcaActivo(registro).subscribe(
      (response: any) => {
        this.traerMarcasActivo();
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
  }

  async insertarMarca(event : any){

    let registro = {
      cDescripcion: event.data.cDescripcion,
      cTipo: "insertar"
    }

    await this.apiService.sincronizarMarcaActivo(registro).subscribe(
      (response: any) => {
        this.traerMarcasActivo();
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
  }

  eliminarMarca(event : any){
    let registro = {
      nCodigo : event.data.nCodigo,
      cTipo : "eliminar"
    };

    this.apiService.sincronizarMarcaActivo(registro).subscribe(
      (response: any) => {
        this.traerMarcasActivo();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
    
  }

  onSelectionChangedGrid(event: any){

    if(this.filasSeleccionadasMarca.length > 0){
      this.activarAgregarModelos = true;
    }else{
      this.activarAgregarModelos = false;
    }

    if(this.filasSeleccionadasMarca[0] !== undefined){
      this.traerModelosActivo(this.filasSeleccionadasMarca[0]);
    }else{
      this.modelos = [];
    }

  }

  actualizarModelo(event : any){

    let registro = event.newData;
    registro.nCodigo = event.oldData.nCodigo;
    registro.cTipo = "actualizar";

    this.apiService.sincronizarModeloActivo(registro).subscribe(
      (response: any) => {
        this.traerModelosActivo(this.filasSeleccionadasMarca[0]);
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
  }

  async insertarModelo(event : any){

    let registro = {
      cDescripcion: event.data.cDescripcion,
      nMarcaActivo: this.filasSeleccionadasMarca[0],
      cTipo: "insertar"
    }

    await this.apiService.sincronizarModeloActivo(registro).subscribe(
      (response: any) => {
        this.traerModelosActivo(this.filasSeleccionadasMarca[0]);
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
  }

  eliminarModelo(event : any){
    let registro = {
      nCodigo : event.data.nCodigo,
      cTipo : "eliminar"
    };

    this.apiService.sincronizarModeloActivo(registro).subscribe(
      (response: any) => {
        this.traerModelosActivo(this.filasSeleccionadasMarca[0]);
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
