import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-departamento',
    templateUrl: './departamento.component.html',
    styleUrl: './departamento.component.css',
    standalone: false
})
export class DepartamentoComponent {

  departamentos : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  username: string | undefined;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerDepartamentos();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

  }

  async traerDepartamentos() {
    this.blockUI.start('Cargando...'); // Start blocking
  
    console.log("traer departamentos");
  
    try {
      const obser = this.apiService.getDepartamentos();
      const result = await firstValueFrom(obser);
  
      // Mapeamos al formato que espera el grid
      this.departamentos = result.map((d: any) => ({
        nCodigo: d.id,        // id → nCodigo
        cNombre: d.nombre,    // nombre → cNombre
        cDetalle: d.paisId    // opcional: usamos paisId como detalle
      }));
  
      console.log("Departamentos mapeados:", this.departamentos);
    } catch (error) {
      console.log('Error trayendo los departamentos.', error);
    } finally {
      this.blockUI.stop();
    }
  }
  

  guardar(event : any){
    console.log(event);
  }

  async actualizar(event: any) {
    const { newData, oldData } = event;
  
    // Construir el body para la API
    let registro = {
      nombre: newData.cNombre ?? oldData.cNombre,   // Si no editan, se queda el viejo
      paisId: Number(newData.cDetalle ?? oldData.cDetalle) || 1
    };
  
    // El ID lo sacamos del dato anterior
    const id = oldData.nCodigo;
  
    try {
      const obser = this.apiService.actualizarDepartamento(id, registro);
      const result = await firstValueFrom(obser);
  
      this.traerDepartamentos();
      console.log("Actualizado:", result);
    } catch (error) {
      event.component.cancelEditData();
      event.cancel = true;
      this.showMessage('Error al actualizar registro.');
      console.error('Error al actualizar registro.', error);
    }
  
    console.log("Registro enviado:", registro);
    console.log("ID enviado:", id);
  }
  

  async insertar(event: any) {
    // Mapear lo que ingresa en la fila a lo que espera la API
    let registro = {
      nombre: event.data.cNombre,                 // API espera "nombre"
      paisId: Number(event.data.cDetalle) || 1    // Si no es número válido => manda 1
    };
  
    this.apiService.crearDepartamento(registro).subscribe(
      (response: any) => {
        this.traerDepartamentos();
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );
  
    console.log("Registro enviado:", registro);
    console.log("Evento:", event);
  }  

  eliminar(event: any) {
    const id = event.data.nCodigo;
  
    this.apiService.eliminarDepartamento(id).subscribe(
      (response: any) => {
        this.traerDepartamentos(); // refrescar lista
        console.log("Registro eliminado:", response);
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );
  
    console.log("ID a eliminar:", id);
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
