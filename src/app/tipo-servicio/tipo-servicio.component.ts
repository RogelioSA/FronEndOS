import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-tipo-servicio',
    templateUrl: './tipo-servicio.component.html',
    styleUrl: './tipo-servicio.component.css',
    standalone: false
})
export class TipoServicioComponent {

  tipos : [] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    await this.traerTipos();

  }

  async traerTipos() {
    this.blockUI.start('Cargando...');
    console.log("traer tipos");
    try {
      const obser = this.apiService.getTiposServicio();
      const result = await firstValueFrom(obser);
  
      this.tipos = result
        .filter((t: any) => t.activo === true)
        .map((t: any) => ({
          nCodigo: t.id,
          cNombre: t.nombre,
          cDetalle: t.nombreCorto, // aquí puedes usar "nombreCorto" como detalle
          bActivo: t.activo
        }));
    } catch (error) {
      console.log('Error trayendo los tipos.');
    } finally {
      this.blockUI.stop();
    }
  }
  

  guardar(event : any){
    console.log(event);
  }

  actualizar(event: any) {
    const actualizado = {
      id: event.key,  // el ID lo saca del keyExpr="nCodigo"
      nombre: event.newData.cNombre ?? event.oldData.cNombre,
      nombreCorto: event.newData.cDetalle ?? event.oldData.cDetalle,
      activo: event.newData.bActivo ?? event.oldData.bActivo
    };
  
    this.apiService.sincronizarTipoServicioEditar(actualizado).subscribe(
      (response: any) => {
        this.traerTipos();
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
      }
    );
  
    console.log('Objeto a enviar:', actualizado);
    console.log('Evento completo:', event);
  }
  

  insertar(event: any) {
    const nuevo = {
      nombre: event.data.cNombre,
      nombreCorto: event.data.cDetalle,
      activo: event.data.bActivo ?? true
    };
  
    this.apiService.sincronizarTipoServicio(nuevo).subscribe({
      next: () => {
        console.log("Registro creado correctamente");
        this.traerTipos();
      },
      error: err => console.error("Error al crear", err)
    });
  }

  eliminar(event: any) {
    const id = event.data.nCodigo; // id de la fila seleccionada
  
    this.apiService.eliminarTipoServicio(id).subscribe(
      (response: any) => {
        this.traerTipos(); // recargar la lista
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );
  
    console.log('ID a eliminar:', id);
    console.log('Evento completo:', event);
  }  

}
