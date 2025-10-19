import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { Router } from '@angular/router';

@Component({
    selector: 'app-activo-servicio',
    templateUrl: './activo-servicio.component.html',
    styleUrl: './activo-servicio.component.css',
    standalone: false
})
export class ActivoServicioComponent {

  activos : [] = [];
  departamentos : [] = [];
  @BlockUI() blockUI!: NgBlockUI;

  constructor(
              private apiService: ApiService,
              private router: Router
            ){}

  async ngOnInit():Promise<void> {

    await this.traerActivos();
    await this.traerDepartamentos();

  }

  async traerActivos() {
    this.blockUI.start('Cargando...'); // Start blocking
    console.log("traer activos");
  
    try {
      const obser = this.apiService.getActivo();
      const result = await firstValueFrom(obser);
  
      // Adaptar la estructura
      this.activos = result.map((x: any) => ({
        nCodigo: x.id,
        cNombre: x.nombre,
        cDetalle: x.descripcion,
        cNumeroSerie: x.productoLoteId || '-',
        cColor: x.color || '-',
        nAnioFabricacion: x.depreciacionMeses || 0,
        imagenUrl: x.imagenUrl
      }));
  
    } catch (error) {
      console.log('Error trayendo los activos.', error);
    } finally {
      this.blockUI.stop();
    }
  }
  

  async traerDepartamentos() {
    this.blockUI.start('Cargando...'); // Start blocking
  
    console.log("traer departamentos");
  
    try {
      const obser = this.apiService.getDepartamentos();
      const result = await firstValueFrom(obser);
  
      // Aquí ya es un array directo
      this.departamentos = result.map((d: any) => ({
        nCodigo: d.id,
        cNombre: d.nombre,
        nPaisId: d.paisId ?? 1  // por defecto 1 si viene null
      }));
  
    } catch (error) {
      console.log('Error trayendo los departamentos.', error);
    } finally {
      this.blockUI.stop();
    }
  }
  

  guardar(event : any){
    console.log(event);
  }

  async eliminar(event : any){
    // Confirmación antes de eliminar
    const confirmacion = confirm(`¿Está seguro de eliminar el activo "${event.data.cNombre}"?`);
    
    if (!confirmacion) {
      return; // Si el usuario cancela, no hace nada
    }

    this.blockUI.start('Eliminando...');

    try {
      // Llamar al API de eliminación
      await firstValueFrom(this.apiService.deleteActivo(event.data.nCodigo));
      
      console.log('Activo eliminado correctamente');
      
      // Recargar la lista de activos
      await this.traerActivos();
      
    } catch (error) {
      console.error('Error al eliminar el activo:', error);
      alert('No se pudo eliminar el activo. Por favor, intente nuevamente.');
    } finally {
      this.blockUI.stop();
    }
  }

  crearNuevo(){
    this.router.navigate(['/mantenimiento/ordenServicio/activo/create']);
  }

  editar(event: any, activo: any){
    console.log(activo);
    event.preventDefault();
    this.router.navigate(['/mantenimiento/ordenServicio/activo/edit/' + activo.data.nCodigo]);
  }

}