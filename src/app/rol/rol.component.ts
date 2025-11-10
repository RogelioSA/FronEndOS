import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
    selector: 'app-rol',
    templateUrl: './rol.component.html',
    styleUrl: './rol.component.css',
    standalone: false
})
export class RolComponent implements OnInit {

  roles : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.traerRoles();

    this.estados = [{ID:'A', Name: 'Activo'},{ID: 'I', Name: 'Inactivo'}];

    // this.apiService.getRoles().subscribe(
    //   response => {
    //     if (response.data) {
    //       this.roles = response.data;
    //       console.log('imprimiendo roles', response);
    //     } else {
    //       console.error('API error:', response.message);
    //     }
    //   },
    //   error => {
    //     console.error('Error connecting to the API:', error);
    //   }
    // );

  }

  async traerRoles() {
    this.blockUI.start('Cargando...');
  
    console.log("traer roles");
  
    try {
      const obser = this.apiService.getRoles();
      const result = await firstValueFrom(obser);
  
      // Mapeo API → formato tabla
      this.roles = result.map((t: any) => ({
        nCodigo: t.id,                // ID del rol
        cNombre: t.name,              // Nombre del rol
        cDetalle: t.normalizedName,   // Nombre normalizado
        cEstado: t.concurrencyStamp ? 'A' : 'I' 
      }));
  
    } catch (error) {
      console.log('Error trayendo los roles.', error);
    } finally {
      this.blockUI.stop();
    }
  }
  

  guardar(event : any){
    console.log(event);
  }

  actualizar(event: any) {
    const empresaId = localStorage.getItem('empresa_id');
    
    if (!empresaId) {
      console.error('No se encontró empresa_id en localStorage');
      return;
    }
    
    const roleId = event.oldData.nCodigo;  
  
    const registro = {
      empresaId: parseInt(empresaId),
      name: event.newData.cNombre || event.oldData.cNombre
    };
  
    this.apiService.actualizarRol(roleId, registro).subscribe(
      (response: any) => {
        this.traerRoles();
      },
      (error: any) => {
        console.error('Error al actualizar registro.', error);
      }
    );
  
    console.log('roleId:', roleId);
    console.log('registro:', registro);
  }
  

  insertar(event: any) {
    const empresaId = localStorage.getItem('empresa_id');
    
    let registro = {
      empresaId: empresaId ? parseInt(empresaId) : 0,
      name: event.data.cNombre
    };
  
    this.apiService.sincronizarRol(registro).subscribe(
      (response: any) => {
        this.traerRoles();
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );
  
    console.log(registro);
  }
  

  eliminar(event: any) {
    const roleId = event.data.nCodigo; // este es tu identificador
  
    this.apiService.eliminarRol(roleId).subscribe(
      (response: any) => {
        this.traerRoles(); // refresca la tabla
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );
  
    console.log('Eliminando roleId:', roleId);
  }
  

}
