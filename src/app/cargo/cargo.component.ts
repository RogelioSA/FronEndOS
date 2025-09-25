import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-cargo',
    templateUrl: './cargo.component.html',
    styleUrl: './cargo.component.css',
    standalone: false
})
export class CargoComponent {

  cargos : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerCargos();

    this.estados = [
      { ID: true, Name: 'Activo' },
      { ID: false, Name: 'Inactivo' }
    ];

  }

  async traerCargos(){
    this.blockUI.start('Cargando...');

    console.log("traer cargos");

    try{
      const obser = this.apiService.getCargos();
      const result = await firstValueFrom(obser);

      this.cargos = result.map((t: any) => ({
        nCodigo: t.id,
        cNombre: t.nombre,
        cDetalle: t.estado
      }));
    }catch(error){
      console.log('Error traendo los cargos.')
    }finally{
      this.blockUI.stop();
    }
  }

  guardar(event : any){
    console.log(event);
  }

  actualizar(event: any) {
    const data = { ...event.oldData, ...event.newData };
  
    let registro = {
      nombre: data.cNombre,
      estado: data.cDetalle
    };
  
    this.apiService.actualizarCargo(data.nCodigo, registro).subscribe(
      (response: any) => {
        console.log('Registro actualizado:', response);
        this.traerCargos();
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
      }
    );
  
    console.log("Registro enviado:", registro);
    console.log("Evento:", event);
  }
  

  insertar(event: any) {
    let registro = {
      nombre: event.data.cNombre,
      estado: event.data.cDetalle 
    };
  
    this.apiService.crearCargo(registro).subscribe(
      (response: any) => {
        console.log('Registro creado:', response);
        this.traerCargos(); 
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );
  
    console.log("Registro enviado:", registro);
  }  

  eliminar(event: any) {
    const id = event.data.nCodigo;
  
    this.apiService.eliminarCargo(id).subscribe(
      (response: any) => {
        console.log('Registro eliminado:', response);
        this.traerCargos(); // refrescar tabla
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );
  
    console.log("ID eliminado:", id);
    console.log("Evento:", event);
  }  

}
