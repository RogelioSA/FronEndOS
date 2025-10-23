import { Component } from '@angular/core';
import { formatDate } from '@angular/common';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-personal-horario',
  templateUrl: './personal-horario.component.html',
  styleUrls: ['./personal-horario.component.css'],
  standalone: false
})
export class PersonalHorarioComponent {
  // Datos
  personalHorarios: any[] = [];
  personalDisponibles: any[] = [];
  horarios: any[] = [];
  ordenes: any[] = [];
  ordenSeleccionadaCompleta: any = null;

  // controles
  ordenCombo: any = null;
  fechaDesde!: Date | null;
  fechaHasta!: Date | null;
  columnasFechas: { field: string; caption: string; date: Date }[] = [];

  // selección y asignación masiva
  seleccionadosMain: any[] = [];
  seleccionDisponibles: any[] = [];
  hayDisponiblesSeleccionados = false;

  desactivarBotonGuardar = true;
  
  // Map para guardar los IDs de OrdenTrabajoPersonal
  ordenTrabajoPersonalIds: Map<number, number> = new Map();
  
  @BlockUI() blockUI!: NgBlockUI;
  
  constructor(private apiService: ApiService) {
    this.inicializar();
  }

  async inicializar() {
    await this.llenarHorarios();
    await this.cargarOrdenesTrabajo();
  }

  async cargarOrdenesTrabajo(): Promise<void> {
    try {
      this.blockUI.start('Cargando órdenes de trabajo...');
      
      const response = await firstValueFrom(
        this.apiService.listarOrdenTrabajoCabecera()
      );
      
      this.ordenes = response.map((ot: any) => ({
        nCodigo: ot.id,
        cOrdenInterna: `${ot.nombre} - ${ot.descripcion}`,
        fechaInicio: ot.fechaInicio,
        fechaFin: ot.fechaFin || ot.fechaCompromiso,
        datosCompletos: ot
      }));
      
      console.log('Órdenes de trabajo cargadas:', this.ordenes);
      
      this.blockUI.stop();
    } catch (error) {
      this.blockUI.stop();
      console.error('Error al cargar órdenes de trabajo:', error);
    }
  }

  onOrdenChange(e: any) {
    const ordenSeleccionada = e.value;
    
    if (!ordenSeleccionada) {
      this.fechaDesde = null;
      this.fechaHasta = null;
      this.ordenSeleccionadaCompleta = null;
      this.limpiarGrillas();
      return;
    }

    const orden = this.ordenes.find(o => o.nCodigo === ordenSeleccionada);
    
    if (orden) {
      this.ordenSeleccionadaCompleta = orden.datosCompletos;
      this.fechaDesde = orden.fechaInicio ? new Date(orden.fechaInicio) : null;
      this.fechaHasta = orden.fechaFin ? new Date(orden.fechaFin) : null;
      
      console.log('Orden seleccionada completa:', this.ordenSeleccionadaCompleta);
      console.log('Fechas asignadas:', {
        desde: this.fechaDesde,
        hasta: this.fechaHasta
      });
      
      this.limpiarGrillas();
    }
  }

  limpiarGrillas() {
    this.personalHorarios = [];
    this.personalDisponibles = [];
    this.columnasFechas = [];
    this.desactivarBotonGuardar = true;
    this.ordenTrabajoPersonalIds.clear();
  }

  async llenarHorarios() {
    this.blockUI.start('Cargando horarios...');
  
    try {
      const result = await firstValueFrom(this.apiService.getHorarios());
  
      // Mapear correctamente: id del horario -> nombre del horario
      this.horarios = result.map((h: any) => ({
        nCodigo: h.id,
        cNombre: h.nombre
      }));
  
      console.log("✅ Horarios cargados:", this.horarios);
  
    } catch (error) {
      console.error('❌ Error cargando horarios:', error);
    } finally {
      this.blockUI.stop();
    }
  }

  /* ================= MÉTODO AUXILIAR PARA OBTENER NOMBRE DE HORARIO ================= */
  obtenerNombreHorario(horarioCabeceraId: number | null | undefined): string {
    if (!horarioCabeceraId) {
      console.log(`⚠️ obtenerNombreHorario: ID es null/undefined`);
      return 'Sin horario';
    }
    
    console.log(`🔍 Buscando horario con ID: ${horarioCabeceraId} en:`, this.horarios);
    
    const horario = this.horarios.find(h => h.nCodigo === horarioCabeceraId);
    
    if (horario) {
      console.log(`✅ Horario encontrado:`, horario);
      return horario.cNombre;
    } else {
      console.log(`❌ No se encontró horario con ID: ${horarioCabeceraId}`);
      return 'Sin horario';
    }
  }

  /* ================= Construcción de columnas & carga de personal ================= */
  async onBuscar() {
    if (!this.ordenCombo || !this.fechaDesde || !this.fechaHasta) {
      this.showMessage('Selecciona una orden de trabajo y verifica las fechas');
      return;
    }
  
    if (this.fechaDesde > this.fechaHasta) {
      this.showMessage('Fecha Desde no puede ser mayor que Fecha Hasta');
      return;
    }
  
    this.blockUI.start('Cargando personal...');
    
    try {
      // IMPORTANTE: Asegurar que los horarios estén cargados
      if (!this.horarios || this.horarios.length === 0) {
        console.log('⚠️ Horarios no cargados, recargando...');
        await this.llenarHorarios();
      }
      
      console.log('📋 Horarios disponibles:', this.horarios);
      
      this.buildDateColumns(this.fechaDesde, this.fechaHasta);
      await this.cargarPersonalAsignado();
      await this.cargarPersonalDisponible();
      this.desactivarBotonGuardar = false;
      
    } catch (error) {
      console.error('Error en onBuscar:', error);
      this.showMessage('Error al cargar el personal');
    } finally {
      this.blockUI.stop();
    }
  }

  buildDateColumns(desde: Date, hasta: Date) {
    this.columnasFechas = [];
    const cur = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
    while (cur <= hasta) {
      const field = 'd' + formatDate(cur, 'yyyyMMdd', 'en-US');
      const caption = `${this.getNombreDia(cur)} ${formatDate(cur, 'dd/MM', 'en-US')}`;
      this.columnasFechas.push({ field, caption, date: new Date(cur) });
      cur.setDate(cur.getDate() + 1);
    }
  }

  getNombreDia(d: Date) {
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    return dias[d.getDay()];
  }

  async cargarPersonalAsignado() {
    if (!this.ordenSeleccionadaCompleta || !this.ordenSeleccionadaCompleta.personales) {
      this.personalHorarios = [];
      this.ordenTrabajoPersonalIds.clear();
      return;
    }
  
    const personalesOT = this.ordenSeleccionadaCompleta.personales;
    const todosPersonal: any[] = await firstValueFrom(this.apiService.getPersonal());
    
    console.log('🔍 Total personal cargado:', todosPersonal.length);
    console.log('🔍 Horarios disponibles para mapeo:', this.horarios);
  
    // Limpiar el Map antes de llenarlo
    this.ordenTrabajoPersonalIds.clear();
  
    this.personalHorarios = personalesOT.map((pOT: any) => {
      const personaData = todosPersonal.find((p: any) => p.id === pOT.personaId);
      
      // Guardar el ID de OrdenTrabajoPersonal en el Map
      if (pOT.id) {
        this.ordenTrabajoPersonalIds.set(pOT.personaId, pOT.id);
      }
      
      const row: any = {
        nEmpleado: pOT.personaId,
        cEmpleado: pOT.persona?.nombreCompleto || 'Desconocido',
        esLider: pOT.esLider
      };
  
      // Obtener el horarioCabeceraId desde personal.horarioCabeceraId
      let horarioCabeceraId = null;
      if (personaData?.personal?.horarioCabeceraId) {
        horarioCabeceraId = personaData.personal.horarioCabeceraId;
        console.log(`🔍 Persona: ${row.cEmpleado} tiene horarioCabeceraId: ${horarioCabeceraId}`);
      } else {
        console.log(`⚠️ Persona: ${row.cEmpleado} NO tiene horarioCabeceraId`);
      }
      
      // Guardar el ID del horario en todas las columnas de fecha
      // DevExtreme lookup lo convertirá automáticamente al nombre
      for (const col of this.columnasFechas) {
        row[col.field] = horarioCabeceraId;
      }
  
      console.log(`✅ ${row.cEmpleado} -> horarioCabeceraId: ${horarioCabeceraId}`);
  
      return row;
    });
  
    console.log('✅ Personal asignado cargado:', this.personalHorarios);
    console.log('✅ Map de IDs:', this.ordenTrabajoPersonalIds);
  }
  
  async cargarPersonalDisponible() {
    try {
      const result: any[] = await firstValueFrom(this.apiService.getPersonal());
  
      const idsAsignados = new Set(
        this.personalHorarios.map(p => p.nEmpleado)
      );
  
      this.personalDisponibles = result
        .filter((p: any) => p.estado === true && !idsAsignados.has(p.id))
        .map((p: any) => {
          // Extraer horarioCabeceraId desde personal.horarioCabeceraId
          const horarioCabeceraId = p.personal?.horarioCabeceraId || null;
          
          console.log(`🔍 Personal disponible: ${p.nombreCompleto} - horarioId: ${horarioCabeceraId}`);
          
          return {
            nEmpleado: p.id,
            cEmpleado: p.nombreCompleto,
            horarioCabeceraId: horarioCabeceraId
          };
        });
  
      console.log("✅ Personal disponible completo:", this.personalDisponibles);
  
    } catch (error) {
      console.error('❌ Error cargando personal disponible:', error);
    }
  }

  /* ================= Agregar desde disponibles ================= */
  onDisponiblesSelectionChanged(e: any) {
    this.seleccionDisponibles = e.selectedRowsData || [];
    this.hayDisponiblesSeleccionados = this.seleccionDisponibles.length > 0;
  }

  async agregarSeleccionados() {
    if (!this.ordenCombo || !this.fechaDesde || !this.fechaHasta) {
      this.showMessage('Selecciona una orden de trabajo y rango de fechas');
      return;
    }
    if (!this.seleccionDisponibles || this.seleccionDisponibles.length === 0) return;
  
    // Obtener empresaId del localStorage (es solo el ID, no un objeto)
    const empresaSeleccionada = localStorage.getItem('empresaSeleccionada');
    console.log('🔍 DEBUG - empresaSeleccionada (raw):', empresaSeleccionada);
  
    if (!empresaSeleccionada) {
      console.error('❌ No existe "empresaSeleccionada" en localStorage');
      this.showMessage('No se encontró la empresa seleccionada en localStorage');
      return;
    }
  
    // Convertir directamente a número, ya que es solo el ID
    const empresaId = parseInt(empresaSeleccionada, 10);
    console.log('🔍 DEBUG - empresaId extraído:', empresaId);
  
    if (!empresaId || isNaN(empresaId)) {
      console.error('❌ empresaId no es un número válido');
      this.showMessage('No se pudo obtener el ID de la empresa');
      return;
    }
  
    this.blockUI.start('Asignando personal...');
  
    try {
      for (const p of this.seleccionDisponibles) {
        // Preparar el payload para la API
        const payload = {
          empresaId: empresaId,
          ordenTrabajoCabeceraId: this.ordenCombo,
          personaId: p.nEmpleado,
          esLider: false
        };
  
        console.log('📤 Payload a enviar:', payload);
  
        // Llamar a la API
        const response = await firstValueFrom(
          this.apiService.crearOrdenTrabajoPersonal(payload)
        );
  
        console.log('✅ Personal asignado en API:', response);
  
        // Guardar el ID retornado para poder eliminarlo después
        if (response && response.id) {
          this.ordenTrabajoPersonalIds.set(p.nEmpleado, response.id);
        }
  
        // Agregar a la tabla visual
        this.addPersonToMain(p);
      }
  
      this.showMessage('Personal asignado correctamente');
      this.seleccionDisponibles = [];
      this.hayDisponiblesSeleccionados = false;
  
    } catch (error) {
      console.error('❌ Error al asignar personal:', error);
      this.showMessage('Error al asignar el personal');
    } finally {
      this.blockUI.stop();
    }
  }

  addPersonToMain(person: any) {
    if (this.personalHorarios.some(x => x.nEmpleado === person.nEmpleado)) return;
  
    const row: any = { 
      nEmpleado: person.nEmpleado, 
      cEmpleado: person.cEmpleado,
      esLider: false
    };
  
    // Usar el método auxiliar para obtener el nombre del horario
    const nombreHorario = this.obtenerNombreHorario(person.horarioCabeceraId);
    
    console.log(`✅ Agregando: ${person.cEmpleado} -> Horario: ${nombreHorario}`);
  
    for (const c of this.columnasFechas) {
      row[c.field] = person.horarioCabeceraId;
    }
  
    this.personalHorarios = [...this.personalHorarios, row];
    this.personalDisponibles = this.personalDisponibles.filter(
      x => x.nEmpleado !== person.nEmpleado
    );
  }

  /* ================= Selección principal ================= */
  onMainGridSelectionChanged(e: any) {
    this.seleccionadosMain = e.selectedRowsData || [];
  }

  /* ================= Desasignar ================= */
  async desasignarSeleccionados() {
    if (!this.seleccionadosMain || this.seleccionadosMain.length === 0) return;

    this.blockUI.start('Desasignando personal...');

    try {
      // Eliminar de la API primero
      for (const p of this.seleccionadosMain) {
        const ordenTrabajoPersonalId = this.ordenTrabajoPersonalIds.get(p.nEmpleado);
        
        if (ordenTrabajoPersonalId) {
          await firstValueFrom(
            this.apiService.eliminarOrdenTrabajoPersonal(ordenTrabajoPersonalId)
          );
          
          console.log(`✅ Personal ${p.cEmpleado} desasignado de la API`);
          
          // Eliminar del Map
          this.ordenTrabajoPersonalIds.delete(p.nEmpleado);
        } else {
          console.warn(`⚠️ No se encontró ID de OrdenTrabajoPersonal para ${p.cEmpleado}`);
        }
      }

      // Mover a disponibles (lógica visual)
      const desasignados = this.seleccionadosMain.map((p: any) => ({
        nEmpleado: p.nEmpleado,
        cEmpleado: p.cEmpleado,
        horarioCabeceraId: null
      }));

      desasignados.forEach(p => {
        if (!this.personalDisponibles.some(d => d.nEmpleado === p.nEmpleado)) {
          this.personalDisponibles = [...this.personalDisponibles, p];
        }
      });

      const ids = new Set(desasignados.map(p => p.nEmpleado));
      this.personalHorarios = this.personalHorarios.filter(p => !ids.has(p.nEmpleado));
      this.seleccionadosMain = [];

      this.showMessage('Personal desasignado correctamente');

    } catch (error) {
      console.error('❌ Error al desasignar personal:', error);
      this.showMessage('Error al desasignar el personal');
    } finally {
      this.blockUI.stop();
    }
  }

  /* ================= Guardar ================= */
  enviarPersonalHorario() {
    if (!this.ordenCombo || !this.fechaDesde || !this.fechaHasta) {
      this.showMessage('Selecciona una orden de trabajo y rango de fechas');
      return;
    }

    const payload = {
      ordenTrabajoCabeceraId: this.ordenCombo,
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta,
      personal: this.personalHorarios.map(p => ({
        personaId: p.nEmpleado,
        nombreCompleto: p.cEmpleado,
        esLider: p.esLider || false
      }))
    };

    console.log('Guardando payload ->', payload);
    this.showMessage('Personal asignado correctamente a la Orden de Trabajo');
  }

  /* ================= Utilidades ================= */
  showMessage(message: string) {
    const box = document.getElementById('messageBox');
    if (!box) {
      alert(message);
      return;
    }
    box.innerText = message;
    box.style.display = 'block';
    setTimeout(() => {
      box.style.display = 'none';
    }, 3000);
  }
}