import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-area',
    templateUrl: './area.component.html',
    styleUrl: './area.component.css',
    standalone: false
})
export class AreaComponent {

  areas : [] = [];
  departamentos : [] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    await this.traerAreas();
    await this.traerDepartamentos();

    console.log(this.areas);

  }

  async traerAreas(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer areas");

    try{
      const obser = this.apiService.getAreas();
      const result = await firstValueFrom(obser);

      this.areas = result.data;
    }catch(error){
      console.log('Error traendo las areas.')
    }finally{
      this.blockUI.stop();
    }
  }

  async traerDepartamentos() {
    this.blockUI.start('Cargando...');
  
    try {
      const obser = this.apiService.getDepartamentos();
      const result = await firstValueFrom(obser);
  
      // Mapear la data de la API al formato esperado por el grid
      this.departamentos = result.map((d: any) => ({
        nCodigo: d.id,
        cNombre: d.nombre
      }));
  
      console.log("Departamentos cargados:", this.departamentos);
    } catch (error) {
      console.log('Error trayendo los departamentos.', error);
    } finally {
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

    this.apiService.sincronizarArea(registro).subscribe(
      (response: any) => {
        this.traerAreas();
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

    this.apiService.sincronizarArea(registro).subscribe(
      (response: any) => {
        this.traerAreas();
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

    this.apiService.sincronizarArea(registro).subscribe(
      (response: any) => {
        this.traerAreas();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }
}
