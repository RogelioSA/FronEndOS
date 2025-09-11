import { Component, HostListener } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-personal-horario',
    templateUrl: './personal-horario.component.html',
    styleUrl: './personal-horario.component.css',
    standalone: false
})
export class PersonalHorarioComponent {

  personalHorarios : any[] = [];
  ordenes : [] = [];
  horarios : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  ordenCombo : any;
  semana: any;
  desactivarBotonGuardar: boolean = true;

  // semana : any[] = [
  //   {codigo: 1, nombre: 'Lunes'},
  //   {codigo: 2, nombre: 'Martes'},
  //   {codigo: 3, nombre: 'Miercoles'},
  //   {codigo: 4, nombre: 'Jueves'},
  //   {codigo: 5, nombre: 'Viernes'},
  //   {codigo: 6, nombre: 'Sabado'},
  //   {codigo: 7, nombre: 'Domingo'},
  // ];

  username: string | undefined;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    //this.traerAsignacionPersonalHorario();
    this.blockUI.start('Cargando...'); // Start blocking

    this.traerOrdenesCombo();
    this.traerHorarios();

    this.blockUI.stop();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

  }

  async traerAsignacionPersonalHorario(ordenServicio: number, anio: number, sem: number){

    console.log("traer asignaciones");

    try{
      const obser = this.apiService.getAsignacionPersonalHorario(ordenServicio, anio, sem);
      const result = await firstValueFrom(obser);

      this.personalHorarios = result.data;
      this.desactivarBotonGuardar = false;
      console.log(this.personalHorarios);
    }catch(error){
      console.log('Error traendo las asignaciones.')
    }finally{
    }
  }

  async traerOrdenesCombo(){
    console.log("traer ordenes");

    try{
      const obser = this.apiService.getOrdenesCombo();
      const result = await firstValueFrom(obser);

      this.ordenes = result.data;
    }catch(error){
      console.log('Error traendo las ordenes.')
    }finally{
    }
  }

  async traerHorarios(){
    console.log("traer horarios");

    try{
      const obser = this.apiService.getHorarios();
      const result = await firstValueFrom(obser);

      this.horarios = result.data;
    }catch(error){
      console.log('Error traendo los horarios.')
    }finally{
    }
  }

  @HostListener('document:keydown.enter', ['$event'])
  actualizar(event: any){
    console.log('actualizado', event);

    if(event.newData.nLunes !== undefined){
      event.oldData.nMartes = event.newData.nLunes;
      event.oldData.nMiercoles = event.newData.nLunes;
      event.oldData.nJueves = event.newData.nLunes;
      event.oldData.nViernes = event.newData.nLunes;
      event.oldData.nSabado = event.newData.nLunes;
      event.oldData.nDomingo = event.newData.nLunes;
    }
  }

  guardar(event : any){
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

  buscar(){
    
    if(this.semana === undefined || this.ordenCombo === undefined)
      return;

    let anio = this.semana.substring(0,4);
    let sem = this.semana.substring(6,8);

    this.traerAsignacionPersonalHorario(this.ordenCombo.nCodigo, anio, sem);

  }

  celdaModificada(){
    console.log('celda modificada');
  }

  async enviarPersonalHorario(){
    console.log('guardando', this.personalHorarios);

    document.getElementById("oculto")?.click();

    let anio = this.semana.substring(0,4);
    let sem = this.semana.substring(6,8);

    let lista = this.personalHorarios.filter((p) => p.nLunes !== null || p.nMartes !== null || p.nMiercoles !== null || p.nJueves !== null || p.nViernes !== null || p.nSabado !== null
                                                    || p.nDomingo !== null);

    
    try{
      const obser = this.apiService.sincronizarAsignacionPersonalHorario(this.ordenCombo.nCodigo, anio, sem, this.personalHorarios);
      const result = await firstValueFrom(obser);
      this.buscar();
    }catch(error){
      console.log('Error grabando el horario de personal.',error)
    }finally{
    }                                                

    console.log(lista);


  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent): void {
    console.log('Tecla Enter detectada');
  }

  onFileChange(event: any){
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = (e) => {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Obtener la primera hoja del archivo Excel
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convertir la hoja de Excel a un formato JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Asignar los datos al DataGrid
        //this.gridData = jsonData.slice(1); // Ignorar la primera fila si es el encabezado
      };
    }
  }

}
