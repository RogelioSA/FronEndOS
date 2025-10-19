import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

interface GrupoTrabajoCabecera {
  id: number;
  empresaId: number;
  nombre: string;
  nombreCorto: string;
  estado: boolean;
}

interface GrupoTrabajoPersona {
  id: number;
  empresaId: number;
  personaId: number;
  esLider: boolean;
  persona?: any;
}

interface Persona {
  id: number;
  nombreCompleto: string;
  documentoIdentidad: string;
}

@Component({
  selector: 'app-grupotrabajo',
  standalone: false,
  templateUrl: './grupotrabajo.component.html',
  styleUrl: './grupotrabajo.component.css'
})
export class GrupotrabajoComponent implements OnInit {
  @BlockUI() blockUI!: NgBlockUI;
  
  cabeceras: GrupoTrabajoCabecera[] = [];
  personas: Persona[] = [];
  personasAsignadas: any[] = [];
  grupoSeleccionado: any = null;
  filasSeleccionadasCabecera: number[] = [];
  filasSeleccionadasPersonas: number[] = [];
  
  visibleToast: boolean = false;
  mensajeToast: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.blockUI.start('Cargando datos...');
      
      // Cargar todas las personas disponibles
      const personasResponse = await firstValueFrom(
        this.apiService.getPersonal()
      );
      this.personas = personasResponse;
      
      // Cargar grupos de trabajo
      const gruposResponse = await firstValueFrom(
        this.apiService.getGruposTrabajo()
      );
      
      // Aplanar la estructura para mostrar solo cabeceras
      this.cabeceras = gruposResponse.map((grupo: any) => ({
        id: grupo.cabecera.id,
        empresaId: grupo.cabecera.empresaId,
        nombre: grupo.cabecera.nombre,
        nombreCorto: grupo.cabecera.nombreCorto,
        estado: grupo.cabecera.estado,
        personas: grupo.personas || []
      }));
      
      this.blockUI.stop();
    } catch (error) {
      this.blockUI.stop();
      this.mostrarToast('Error al cargar los datos');
      console.error('Error:', error);
    }
  }

  onSelectionChangedCabecera(event: any): void {
    if (event.selectedRowsData && event.selectedRowsData.length > 0) {
      this.grupoSeleccionado = event.selectedRowsData[0];
      this.cargarPersonasDelGrupo();
    } else {
      this.grupoSeleccionado = null;
      this.personasAsignadas = [];
      this.filasSeleccionadasPersonas = [];
    }
  }

  cargarPersonasDelGrupo(): void {
    if (!this.grupoSeleccionado || !this.grupoSeleccionado.personas) {
      this.personasAsignadas = [];
      this.filasSeleccionadasPersonas = [];
      return;
    }

    // Mapear las personas asignadas con su información completa
    this.personasAsignadas = this.grupoSeleccionado.personas.map((gp: any) => {
      const persona = this.personas.find(p => p.id === gp.personaId);
      return {
        id: gp.id,
        personaId: gp.personaId,
        esLider: gp.esLider,
        nombreCompleto: persona ? persona.nombreCompleto : 'Desconocido',
        documentoIdentidad: persona ? persona.documentoIdentidad : ''
      };
    });

    // Seleccionar las personas que ya están asignadas
    this.filasSeleccionadasPersonas = this.personasAsignadas.map(pa => pa.personaId);
  }

  onSelectionChangedPersonas(event: any): void {
    // Este evento se dispara cuando cambia la selección de personas
    // Las personas seleccionadas se guardarán al hacer clic en "Guardar"
  }

  async guardarCambios(): Promise<void> {
    if (!this.grupoSeleccionado) {
      this.mostrarToast('Debe seleccionar un grupo de trabajo');
      return;
    }

    try {
      this.blockUI.start('Guardando cambios...');

      // Construir el array de personas según las seleccionadas
      const personasSeleccionadas = this.filasSeleccionadasPersonas.map(personaId => {
        // Buscar si la persona ya existía en el grupo
        const personaExistente = this.grupoSeleccionado.personas?.find(
          (p: any) => p.personaId === personaId
        );

        return {
          empresaId: this.grupoSeleccionado.empresaId,
          id: personaExistente ? personaExistente.id : 0,
          personaId: personaId,
          esLider: personaExistente ? personaExistente.esLider : false
        };
      });

      const datosActualizados = {
        cabecera: {
          empresaId: this.grupoSeleccionado.empresaId,
          nombre: this.grupoSeleccionado.nombre,
          nombreCorto: this.grupoSeleccionado.nombreCorto,
          estado: this.grupoSeleccionado.estado
        },
        personas: personasSeleccionadas
      };

      await firstValueFrom(
        this.apiService.actualizarGrupoTrabajo(this.grupoSeleccionado.id, datosActualizados)
      );

      await this.cargarDatos();
      
      // Reseleccionar el grupo actual
      this.filasSeleccionadasCabecera = [this.grupoSeleccionado.id];
      const grupoActualizado = this.cabeceras.find(c => c.id === this.grupoSeleccionado.id);
      if (grupoActualizado) {
        this.grupoSeleccionado = grupoActualizado;
        this.cargarPersonasDelGrupo();
      }

      this.blockUI.stop();
      this.mostrarToast('Cambios guardados exitosamente', 'success');
    } catch (error) {
      this.blockUI.stop();
      this.mostrarToast('Error al guardar los cambios');
      console.error('Error:', error);
    }
  }

  mostrarToast(mensaje: string, tipo: string = 'error'): void {
    this.mensajeToast = mensaje;
    this.visibleToast = true;
    
    setTimeout(() => {
      this.visibleToast = false;
    }, 3000);
  }
}