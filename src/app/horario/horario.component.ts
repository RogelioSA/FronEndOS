import { Component, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DxDataGridComponent } from 'devextreme-angular';

@Component({
  selector: 'app-horario',
  templateUrl: './horario.component.html',
  styleUrl: './horario.component.css'
})
export class HorarioComponent {

  horarios : [] = [];
  descansos : [] = [];
  filasSeleccionadasDescanso : any[] = [];
  filasSeleccionadasHorario : any[] = [];

  desactivarTreeList: boolean = true;

  @ViewChild('dataGrid', { static: false }) dataGrid!: DxDataGridComponent;

  @BlockUI() blockUI!: NgBlockUI;


  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    await this.traerHorarios();
    await this.traerDescansos();

  }

  async traerHorarios(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer horarios");

    try{
      const obser = this.apiService.getHorarios();
      const result = await firstValueFrom(obser);

      this.horarios = result.data;
    }catch(error){
      console.log('Error traendo los horarios.')
    }finally{
      this.blockUI.stop();
    }
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
    registro.descansos = this.filasSeleccionadasDescanso,
    registro.cTipo = "actualizar";

    this.apiService.sincronizarHorario(registro).subscribe(
      (response: any) => {
        this.traerHorarios();
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
      cEntrada: event.data.cEntrada,
      cInicioEntrada: event.data.cInicioEntrada,
      cFinalEntrada: event.data.cFinalEntrada,
      cSalida: event.data.cSalida,
      cInicioSalida: event.data.cInicioSalida,
      cFinalSalida: event.data.cFinalSalida,
      nDiasTrabajo: event.data.nDiasTrabajo,
      descansos: this.filasSeleccionadasDescanso,
      cTipo: "insertar"
    }

    this.apiService.sincronizarHorario(registro).subscribe(
      (response: any) => {
        this.traerHorarios();
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );

    console.log('insertando',registro);

    console.log(event);
  }

  eliminar(event : any){
    let registro = {
      nCodigo : event.data.nCodigo,
      cTipo : "eliminar"
    };

    this.apiService.sincronizarHorario(registro).subscribe(
      (response: any) => {
        this.traerHorarios();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }

  iniciaEdicion(event: any){
    //console.log('inicia la edicion',event);

    this.filasSeleccionadasHorario = [event.data.nCodigo];

    this.desactivarTreeList = false;
  }

  cancelaEdicion(event: any){
    //console.log('cancela la edicion');
    this.desactivarTreeList = true;
  }

  agregarNuevaFila(event: any){
    //console.log('agrega fila');
    this.desactivarTreeList = false;

    this.filasSeleccionadasHorario = [];
    this.filasSeleccionadasDescanso = [];
  }

  async traerHorarioDescanso(rol : number){
    console.log("traer horarioDescansos");

    try{
      const obser = this.apiService.getHorarioDescansos(rol);
      const result = await firstValueFrom(obser);

      this.filasSeleccionadasDescanso = result.data;
    }catch(error){
      console.log('Error traendo los horarioDescansos.')
    }finally{
    }
  }

  async onSelectionChangedGrid(event: any) {
    if(event.selectedRowsData.length > 0){
      await this.traerHorarioDescanso(event.selectedRowsData[0].nCodigo);
    }else{
      this.filasSeleccionadasDescanso = [];
    }
  }

  guardando(event : any){

    if(event.changes.length === 0){

      let registro = {
        nCodigo: this.filasSeleccionadasHorario[0],
        descansos: this.filasSeleccionadasDescanso,
        cTipo: "actualizar"
      }

      this.apiService.sincronizarHorario(registro).subscribe(
        (response: any) => {
          this.traerHorarios();
        },
        (error: any) => {
          console.error('Error al insertar registro.', error);
        }
      );

      console.log('guardando',event);
    }

  }

}
