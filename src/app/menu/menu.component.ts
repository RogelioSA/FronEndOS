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
  modulos: any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerMenus();
    await this.traerModulos();
    this.estados = [{ID: true, Name: 'Activo'},{ID: false, Name: 'Inactivo'}];

  }

  async traerModulos() {
    try {
      const result = await firstValueFrom(this.apiService.listarModulos());
      this.modulos = result;
    } catch (error) {
      console.error('Error trayendo módulos', error);
    }
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
        moduloId: m.moduloId,
        cNombre: m.nombre,
        cNombreMostrar: m.nombreCorto,
        cDetalle: m.descripcion,
        cAction: m.action,
        cIcono: m.icono,
        cValorClave: m.claimType,
        nOrden: m.orden,
        lEstado: m.estado
      }));
  
      console.log("Menus mapeados:", this.menus);
    } catch (error) {
      console.log('Error trayendo los menus.', error);
    } finally {
      this.blockUI.stop();
    }
  }
  

  actualizar(event: any) {

    const moduloId =
      event.newData.moduloId ??
      event.oldData.moduloId;
  
    let body = {
      parentId: event.newData.nPadre ?? event.oldData.nPadre ?? null,
      moduloId: moduloId,
      nombre: event.newData.cNombre ?? event.oldData.cNombre,
      nombreCorto: event.newData.cNombreMostrar ?? event.oldData.cNombreMostrar,
      descripcion: event.newData.cDetalle ?? event.oldData.cDetalle ?? '',
      controlador: moduloId,
      action: event.newData.cAction ?? event.oldData.cAction ?? '',
      icono: event.newData.cIcono ?? event.oldData.cIcono ?? '',
      claimType: event.newData.cValorClave ?? event.oldData.cValorClave ?? '',
      orden: event.newData.nOrden ?? event.oldData.nOrden ?? 0,
      estado: event.newData.lEstado ?? event.oldData.lEstado ?? true
    };
  
    this.apiService.actualizarMenu(event.oldData.nCodigo, body).subscribe(() => {
      this.traerMenus();
    });
  
    console.log('Body enviado:', body);
  }
  

  insertar(event: any) {
  
    let body = {
      parentId: event.data.nPadre ?? null,
      moduloId: event.data.moduloId,
      nombre: event.data.cNombre,
      nombreCorto: event.data.cNombreMostrar,
      descripcion: event.data.cDetalle ?? '',
      controlador: event.data.moduloId,
      action: event.data.cAction ?? '',
      icono: event.data.cIcono ?? '',
      claimType: event.data.cValorClave ?? '',
      orden: event.data.nOrden ?? 0,
      estado: event.data.lEstado ?? true
    };
  
    this.apiService.crearMenu(body).subscribe(() => {
      this.traerMenus();
    });
  
    console.log('Body enviado:', body);
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
