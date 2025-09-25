import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-contrato-tipo',
    templateUrl: './contrato-tipo.component.html',
    styleUrl: './contrato-tipo.component.css',
    standalone: false
})
export class ContratoTipoComponent {

  contratoTipos : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerContratoTipos();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

  }

  async traerContratoTipos() {
    this.blockUI.start('Cargando...');
  
    try {
      const obser = this.apiService.getContratoTipos();
      const result = await firstValueFrom(obser);
  
      // Mapear al formato que la tabla espera
      this.contratoTipos = result.map((c: any) => ({
        nCodigo: c.id,
        cNombre: c.nombre,
        cDetalle: c.detalle
      }));
  
      console.log("Contrato Tipos cargados:", this.contratoTipos);
    } catch (error) {
      console.log('Error trayendo los tipos.', error);
    } finally {
      this.blockUI.stop();
    }
  }
  

  guardar(event : any){
    console.log(event);
  }

  actualizar(event: any) {
    const id = event.oldData.nCodigo; // el id que ya existía en la fila
    const registro = {
      nombre: event.newData.cNombre ?? event.oldData.cNombre,
      detalle: event.newData.cDetalle ?? event.oldData.cDetalle
    };
  
    this.apiService.actualizarContratoTipo(id, registro).subscribe(
      (response: any) => {
        this.traerContratoTipos();
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
        event.component.cancelEditData(); // cancela si hubo error
      }
    );
  
    console.log('Registro enviado:', registro);
    console.log('Evento:', event);
  }
  

  insertar(event: any) {
    // Armamos el body en el formato que pide la API
    const registro = {
      nombre: event.data.cNombre,
      detalle: event.data.cDetalle
    };
  
    this.apiService.crearContratoTipo(registro).subscribe(
      (response: any) => {
        this.traerContratoTipos();
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );
  
    console.log("Registro enviado:", registro);
    console.log("Evento:", event);
  }
  

  eliminar(event: any) {
    const id = event.data.nCodigo; // el id de la fila seleccionada
  
    this.apiService.eliminarContratoTipo(id).subscribe(
      (response: any) => {
        this.traerContratoTipos(); // refresca la tabla
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
        event.component.cancelEditData(); // cancela en caso de error
      }
    );
  
    console.log('ID eliminado:', id);
    console.log('Evento:', event);
  }
  

}
