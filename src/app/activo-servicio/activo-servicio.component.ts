import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { Router } from '@angular/router';

@Component({
  selector: 'app-activo-servicio',
  templateUrl: './activo-servicio.component.html',
  styleUrl: './activo-servicio.component.css'
})
export class ActivoServicioComponent {

  activos : [] = [];
  departamentos : [] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(
              private apiService: ApiService,
              private router: Router
            ){}

  async ngOnInit():Promise<void> {

    await this.traerActivos();
    await this.traerDepartamentos();

  }

  async traerActivos(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer activos");

    try{
      const obser = this.apiService.getActivos();
      const result = await firstValueFrom(obser);

      this.activos = result.data;
    }catch(error){
      console.log('Error traendo los activos.')
    }finally{
      this.blockUI.stop();
    }
  }

  async traerDepartamentos(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer departamentos");

    try{
      const obser = this.apiService.getDepartamentos();
      const result = await firstValueFrom(obser);

      this.departamentos = result.data;
    }catch(error){
      console.log('Error traendo los departamentos.')
    }finally{
      this.blockUI.stop();
    }
  }

  guardar(event : any){
    console.log(event);
  }

  eliminar(event : any){
    let registro = {
      nCodigo : event.data.nCodigo,
      cTipo : "eliminar",
      parametros: []
    };

    this.apiService.sincronizarActivo(registro).subscribe(
      (response: any) => {
        this.traerActivos();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    // console.log(registro);

    // console.log(event);
    
  }

  crearNuevo(){
    this.router.navigate(['/mantenimiento/ordenServicio/activo/create']);
  }

  editar(event: any, activo: any){
    console.log(activo);
    event.preventDefault();
    this.router.navigate(['/mantenimiento/ordenServicio/activo/edit/' + activo.data.nCodigo]);
  }

}
