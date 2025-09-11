import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';


@Component({
    selector: 'app-cliente',
    templateUrl: './cliente.component.html',
    styleUrl: './cliente.component.css',
    standalone: false
})
export class ClienteComponent {

  clientes : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  username: string | undefined;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerClientes();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

  }

  async traerClientes(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer clientes");

    try{
      const obser = this.apiService.getClientes();
      const result = await firstValueFrom(obser);

      this.clientes = result.data;
    }catch(error){
      console.log('Error traendo los clientes.')
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

    this.apiService.sincronizarCliente(registro).subscribe(
      (response: any) => {
        this.traerClientes();
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
      cRUC: event.data.cRUC,
      cRazonSocial: event.data.cRazonSocial,
      cNombres: event.data.cNombres === undefined ? '' : event.data.cNombres,
      cApePat: event.data.cApePat === undefined ? '' : event.data.cApePat,
      cApeMat: event.data.cApeMat === undefined ? '' : event.data.cApeMat,
      cDNI: event.data.cDNI,
      cTipo: "insertar"
    }

    await this.apiService.sincronizarCliente(registro).subscribe(
      (response: any) => {
        this.traerClientes();
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

    this.apiService.sincronizarCliente(registro).subscribe(
      (response: any) => {
        this.traerClientes();
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
