import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DxTreeListTypes } from 'devextreme-angular/ui/tree-list';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.css',
    standalone: false
})
export class MenuComponent {

  menus : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerMenus();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

  }

  async traerMenus() {
    this.blockUI.start('Cargando...');
  
    try {
      const obser = this.apiService.getMenus();
      const result = await firstValueFrom(obser);
  
      // Mapear los campos
      this.menus = result.map((m: any) => ({
        nCodigo: m.id,
        nPadre: m.parentId,
        cNombre: m.nombre,
        cNombreMostrar: m.nombreCorto,
        cDetalle: m.descripcion,
        cIcono: m.icono,
        cPath: m.controlador && m.action ? `${m.controlador}/${m.action}` : '',
        nOrden: m.orden
      }));
  
      console.log("Menus mapeados:", this.menus);
    } catch (error) {
      console.log('Error trayendo los menus.', error);
    } finally {
      this.blockUI.stop();
    }
  }
  

  guardar(event : any){
    console.log(event);
  }

  actualizar(event: any) {
    const id = event.oldData.nCodigo; // ID del menú a actualizar
  
    // Mapear newData a la estructura de la API
    let body = {
      parentId: event.newData.nPadre ?? event.oldData.nPadre ?? 0,
      moduloId: 0, // si en el futuro lo tienes, cámbialo aquí
      nombre: event.newData.cNombre ?? event.oldData.cNombre,
      nombreCorto: event.newData.cNombreMostrar ?? event.oldData.cNombreMostrar,
      descripcion: event.newData.cDetalle ?? event.oldData.cDetalle ?? '',
      controlador: (event.newData.cPath ?? event.oldData.cPath)?.split('/')[0] ?? '',
      action: (event.newData.cPath ?? event.oldData.cPath)?.split('/')[1] ?? '',
      icono: event.newData.cIcono ?? event.oldData.cIcono ?? '',
      claimType: '', // lo dejas vacío si no lo usas
      orden: event.newData.nOrden ?? event.oldData.nOrden ?? 0,
      estado: true
    };
  
    this.apiService.actualizarMenu(id, body).subscribe(
      (response: any) => {
        this.traerMenus();
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
      }
    );
  
    console.log("ID:", id);
    console.log("Body enviado a la API:", body);
    console.log("Evento recibido:", event);
  }
  

  insertar(event: any) {
    // Mapear los campos a la estructura de la API
    let body = {
      parentId: event.data.nPadre ?? 0,
      moduloId: 0, // si más adelante recibes este dato, reemplázalo
      nombre: event.data.cNombre,
      nombreCorto: event.data.cNombreMostrar,
      descripcion: event.data.cDetalle ?? '',
      controlador: event.data.cPath ? event.data.cPath.split('/')[0] : '',
      action: event.data.cPath ? event.data.cPath.split('/')[1] : '',
      icono: event.data.cIcono ?? '',
      claimType: '', // por ahora vacío
      orden: event.data.nOrden ?? 0,
      estado: true
    };
  
    this.apiService.crearMenu(body).subscribe(
      (response: any) => {
        this.traerMenus();
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );
  
    console.log("Body enviado a la API:", body);
    console.log("Evento recibido:", event);
  }
  

  eliminar(event: any) {
    const id = event.data.nCodigo; // ID del menú a eliminar
  
    this.apiService.eliminarMenu(id).subscribe(
      (response: any) => {
        this.traerMenus();
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );
  
    console.log("ID eliminado:", id);
    console.log("Evento recibido:", event);
  }
  

  initNewRow(e: DxTreeListTypes.InitNewRowEvent) {
    // e.data.Task_Status = 'Not Started';
    // e.data.Task_Start_Date = new Date();
    // e.data.Task_Due_Date = new Date();
    console.log("agregando fila",e)
  }

}
