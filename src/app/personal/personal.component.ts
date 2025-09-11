import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-personal',
    templateUrl: './personal.component.html',
    styleUrl: './personal.component.css',
    standalone: false
})
export class PersonalComponent {

  personal : [] = [];
  cargos : [] = [];
  areas : [] = [];
  contratoTipos : [] = [];
  situaciones : [] = [];
  condiciones : [] = [];
  categorias : [] = [];
  sexo : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.blockUI.start('Cargando...'); // Start blocking

    await this.traerPersonal();
    await this.traerCargos();
    await this.traerAreas();
    await this.traerContratoTipos();
    await this.traerSituaciones();
    await this.traerCondiciones();
    await this.traerLicenciaCategorias();

    this.blockUI.stop();

    this.sexo = [{nCodigo:'M', cNombre: 'MUJER'},{nCodigo: 'H', cNombre: 'HOMBRE'}];

  }

  async traerPersonal(){
    console.log("traer personal");

    try{
      const obser = this.apiService.getPersonal();
      const result = await firstValueFrom(obser);

      this.personal = result.data;
      // console.log(this.personal);
    }catch(error){
      console.log('Error traendo el personal.')
    }finally{
    }
  }

  async traerCargos(){
    console.log("traer cargos");

    try{
      const obser = this.apiService.getCargos();
      const result = await firstValueFrom(obser);

      this.cargos = result.data;
    }catch(error){
      console.log('Error traendo los cargos.')
    }finally{
    }
  }

  async traerAreas(){
    console.log("traer areas");

    try{
      const obser = this.apiService.getAreas();
      const result = await firstValueFrom(obser);

      this.areas = result.data;
    }catch(error){
      console.log('Error traendo las areas.')
    }finally{
    }
  }

  async traerContratoTipos(){
    console.log("traer tipos");

    try{
      const obser = this.apiService.getContratoTipos();
      const result = await firstValueFrom(obser);

      this.contratoTipos = result.data;
    }catch(error){
      console.log('Error traendo los tipos.')
    }finally{
    }
  }

  async traerSituaciones(){
    console.log("traer situaciones");

    try{
      const obser = this.apiService.getPersonalSituaciones();
      const result = await firstValueFrom(obser);

      this.situaciones = result.data;
    }catch(error){
      console.log('Error traendo las situaciones.')
    }finally{
    }
  }

  async traerCondiciones(){
    console.log("traer condiciones");

    try{
      const obser = this.apiService.getCondicionesContract();
      const result = await firstValueFrom(obser);

      this.condiciones = result.data;
    }catch(error){
      console.log('Error traendo las condiciones.')
    }finally{
    }
  }

  async traerLicenciaCategorias(){
    console.log("traer categorias");

    try{
      const obser = this.apiService.getLicenciaCategorias();
      const result = await firstValueFrom(obser);

      this.categorias = result.data;
    }catch(error){
      console.log('Error traendo las categorias.')
    }finally{
    }
  }

  guardar(event : any){
    console.log(event);
  }

  actualizar(event : any){

    let registro = event.newData;
    registro.nCodigo = event.oldData.nCodigo;
    registro.cTipo = "actualizar";

    this.apiService.sincronizarPersonal(registro).subscribe(
      (response: any) => {
        this.traerPersonal();
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
      cNombres: event.data.cNombres,
      cApPater: event.data.cApPater,
      cApMater: event.data.cApMater,
      dFechaNacimiento: event.data.dFechaNacimiento,
      cSexo: event.data.cSexo,
      cDNI: event.data.cDNI,
      nCargo: event.data.nCargo,
      nArea: event.data.nArea,
      dFechaIngreso: event.data.dFechaIngreso,
      nContratoTipo: event.data.nContratoTipo,
      nCondicionContractual: event.data.nCondicionContractual,
      nPersonalSituacion: event.data.nPersonalSituacion,
      cCorreo: event.data.cCorreo,
      cCelular: event.data.cCelular,
      nLicenciaCategoria: event.data.nLicenciaCategoria,
      cUsuario: event.data.cUsuario,
      lEstado: event.data.lEstado,
      cTipo: "insertar"
    }

    this.apiService.sincronizarPersonal(registro).subscribe(
      (response: any) => {
        this.traerPersonal();
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

    this.apiService.sincronizarPersonal(registro).subscribe(
      (response: any) => {
        this.traerPersonal();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }

}
