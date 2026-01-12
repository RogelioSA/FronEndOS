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
    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

  }

  async traerModulos() {
    try {
      const result = await firstValueFrom(this.apiService.listarModulos());
      this.modulos = result;
    } catch (error) {
      console.error('Error trayendo módulos', error);
    }
  }

  obtenerDatosModulo(moduloId: number) {
    const modulo = this.modulos.find(m => m.id === moduloId);
    return {
      controlador: modulo?.controlador ?? '',
      action: modulo?.action ?? ''
    };
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
        moduloId: m.moduloId, // 🔥 IMPORTANTE
        cNombre: m.nombre,
        cNombreMostrar: m.nombreCorto,
        cDetalle: m.descripcion,
        cIcono: m.icono,
        cPath: m.claimType,
        nOrden: m.orden
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
  
    const datosModulo = this.obtenerDatosModulo(moduloId);
  
    let body = {
      parentId: event.newData.nPadre ?? event.oldData.nPadre ?? 0,
      moduloId: moduloId,
      nombre: event.newData.cNombre ?? event.oldData.cNombre,
      nombreCorto: event.newData.cNombreMostrar ?? event.oldData.cNombreMostrar,
      descripcion: event.newData.cDetalle ?? event.oldData.cDetalle ?? '',
      controlador: datosModulo.controlador, // 👈
      action: datosModulo.action,           // 👈
      icono: event.newData.cIcono ?? event.oldData.cIcono ?? '',
      claimType: event.newData.cPath ?? event.oldData.cPath ?? '',
      orden: event.newData.nOrden ?? event.oldData.nOrden ?? 0,
      estado: true
    };
  
    this.apiService.actualizarMenu(event.oldData.nCodigo, body).subscribe(() => {
      this.traerMenus();
    });
  
    console.log('Body enviado:', body);
  }
  

  insertar(event: any) {

    const datosModulo = this.obtenerDatosModulo(event.data.moduloId);
  
    let body = {
      parentId: event.data.nPadre ?? 0,
      moduloId: event.data.moduloId,
      nombre: event.data.cNombre,
      nombreCorto: event.data.cNombreMostrar,
      descripcion: event.data.cDetalle ?? '',
      controlador: datosModulo.controlador, // 👈
      action: datosModulo.action,           // 👈
      icono: event.data.cIcono ?? '',
      claimType: event.data.cPath ?? '',
      orden: event.data.nOrden ?? 0,
      estado: true
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
