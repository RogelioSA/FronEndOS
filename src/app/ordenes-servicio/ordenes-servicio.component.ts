import { Component } from '@angular/core';

@Component({
  selector: 'app-ordenes-servicio',
  standalone: false,
  templateUrl: './ordenes-servicio.component.html',
  styleUrl: './ordenes-servicio.component.css'
})
export class OrdenesServicioComponent {

  ordenes: any[] = [
    { codigo: 'S-033-25', cliente: 'SOCIEDAD MINERA CERRO VERDE', area: 'C2', servicio: 'PREPARACION DE ROLLOS FAJAS FEEDERS', tipoServicio: 'Mantenimiento' },
    { codigo: 'S-034-23', cliente: 'SOCIEDAD MINERA CERRO VERDE', area: 'C1', servicio: 'SERVICIO CAMBIO Y EMPALME DE FAJA CV012', tipoServicio: 'Instalación' }
  ];

  popupVisible = false;   // controla popup
  editMode = false;       // si es editar o crear
  selectedOrden: any = {}; // datos del formulario

  tiposServicio = [
    { id: 1, nombre: 'Mantenimiento' },
    { id: 2, nombre: 'Instalación' },
    { id: 3, nombre: 'Inspección' },
    { id: 4, nombre: 'Reparación' }
  ];

  // abrir popup para crear
  crearNuevo() {
    this.editMode = false;
    this.selectedOrden = {};
    this.popupVisible = true;
  }

  // abrir popup para editar
  editarOrden(data: any) {
    this.editMode = true;
    this.selectedOrden = { ...data.row.data };
    this.popupVisible = true;
  }

  // guardar orden
  guardarOrden() {
    if (this.editMode) {
      const index = this.ordenes.findIndex(o => o.codigo === this.selectedOrden.codigo);
      if (index !== -1) {
        this.ordenes[index] = { ...this.selectedOrden };
      }
    } else {
      this.selectedOrden.codigo = 'S-' + Math.floor(Math.random() * 1000) + '-25';
      this.ordenes.push({ ...this.selectedOrden });
    }
    this.popupVisible = false;
  }

  eliminarFila(e: any) {
    const codigo = e.row.data.codigo;
    this.ordenes = this.ordenes.filter(o => o.codigo !== codigo);
  }
}
