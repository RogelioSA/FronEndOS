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

  // Nuevo: Horario seleccionado para asignación masiva
  horarioSeleccionadoMasivo: number | null = null;

  desactivarBotonGuardar = true;
  cargandoPersonal = false;

  // Map para guardar los IDs de OrdenTrabajoPersonal
  ordenTrabajoPersonalIds: Map<number, number> = new Map();

  // Empresa ID
  empresaId: number = Number(localStorage.getItem('empresa_id')) || 0;

  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService) {
    this.inicializar();
  }

  async inicializar() {
    this.obtenerEmpresaId();
    await this.llenarHorarios();
    await this.cargarOrdenesTrabajo();
  }

  obtenerEmpresaId() {
    const empresaSeleccionada = localStorage.getItem('empresa_id');
    if (empresaSeleccionada) {
      this.empresaId = parseInt(empresaSeleccionada, 10);
    }
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
    this.horarioSeleccionadoMasivo = null;
  }

  async llenarHorarios() {
    this.blockUI.start('Cargando horarios...');

    try {
      const result = await firstValueFrom(this.apiService.getHorarios());

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

  obtenerNombreHorario(horarioCabeceraId: number | null | undefined): string {
    if (!horarioCabeceraId) {
      return 'Sin horario';
    }

    const horario = this.horarios.find(h => h.nCodigo === horarioCabeceraId);
    return horario ? horario.cNombre : 'Sin horario';
  }

  async onBuscar() {
    if (!this.ordenCombo || !this.fechaDesde || !this.fechaHasta) {
      this.showMessage('Selecciona una orden de trabajo y verifica las fechas');
      return;
    }

    if (this.fechaDesde > this.fechaHasta) {
      this.showMessage('Fecha Desde no puede ser mayor que Fecha Hasta');
      return;
    }

    this.cargandoPersonal = true;

    try {
      if (!this.horarios || this.horarios.length === 0) {
        console.log('⚠️ Horarios no cargados, recargando...');
        await this.llenarHorarios();
      }

      console.log('📋 Horarios disponibles:', this.horarios);

      this.buildDateColumns(this.fechaDesde, this.fechaHasta);
      await this.cargarPersonalAsignado();
      await this.cargarPersonalDisponible();
      await this.cargarHorariosAsignados();
      this.desactivarBotonGuardar = false;

    } catch (error) {
      console.error('Error en onBuscar:', error);
      this.showMessage('Error al cargar el personal');
    } finally {
      this.cargandoPersonal = false;
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

    this.ordenTrabajoPersonalIds.clear();

    this.personalHorarios = personalesOT.map((pOT: any) => {
      const personaData = todosPersonal.find((p: any) => p.id === pOT.personaId);

      if (pOT.id) {
        this.ordenTrabajoPersonalIds.set(pOT.personaId, pOT.id);
      }

      const row: any = {
        nEmpleado: pOT.personaId,
        cEmpleado: pOT.persona?.nombreCompleto || 'Desconocido',
        esLider: pOT.esLider
      };

      // Inicializar todas las fechas sin horario
      for (const col of this.columnasFechas) {
        row[col.field] = null;
      }

      return row;
    });

    console.log('✅ Personal asignado cargado:', this.personalHorarios);
  }

  async cargarHorariosAsignados() {
    if (!this.ordenCombo || !this.fechaDesde || !this.fechaHasta || this.personalHorarios.length === 0) {
      return;
    }

    try {
      const inicio = formatDate(this.fechaDesde, 'yyyy-MM-dd', 'en-US');
      const fin = formatDate(this.fechaHasta, 'yyyy-MM-dd', 'en-US');

      const horarios = await firstValueFrom(
        this.apiService.obtenerHorariosPorOrdenYRango(this.ordenCombo, inicio, fin)
      );

      console.log('📅 Horarios obtenidos de la API:', horarios);

      // Mapear los horarios al grid
      horarios.forEach((h: any) => {
        const persona = this.personalHorarios.find(p => p.nEmpleado === h.personalId);
        if (persona) {
          const fecha = new Date(h.fecha);
          const field = 'd' + formatDate(fecha, 'yyyyMMdd', 'en-US');
          persona[field] = h.horarioCabeceraId;
        }
      });

      // Forzar actualización del grid
      this.personalHorarios = [...this.personalHorarios];

      console.log('✅ Horarios asignados al grid:', this.personalHorarios);

    } catch (error) {
      console.error('❌ Error al cargar horarios asignados:', error);
    }
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
          const horarioCabeceraId = p.personal?.horarioCabeceraId || null;

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

    if (!this.empresaId) {
      this.showMessage('No se encontró la empresa seleccionada');
      return;
    }

    this.blockUI.start('Asignando personal...');

    try {
      for (const p of this.seleccionDisponibles) {
        const payload = {
          empresaId: this.empresaId,
          ordenTrabajoCabeceraId: this.ordenCombo,
          personaId: p.nEmpleado,
          esLider: false
        };

        console.log('📤 Payload a enviar:', payload);

        const response = await firstValueFrom(
          this.apiService.crearOrdenTrabajoPersonal(payload)
        );

        console.log('✅ Personal asignado en API:', response);

        if (response && response.id) {
          this.ordenTrabajoPersonalIds.set(p.nEmpleado, response.id);
        }

        // Si tiene horario predeterminado, asignarlo a todas las fechas
        if (p.horarioCabeceraId) {
          await this.asignarHorarioATodoElRango(p.nEmpleado, p.horarioCabeceraId);
        }

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

    for (const c of this.columnasFechas) {
      row[c.field] = person.horarioCabeceraId || null;
    }

    this.personalHorarios = [...this.personalHorarios, row];
    this.personalDisponibles = this.personalDisponibles.filter(
      x => x.nEmpleado !== person.nEmpleado
    );
  }

  onMainGridSelectionChanged(e: any) {
    this.seleccionadosMain = e.selectedRowsData || [];
  }

  async desasignarSeleccionados() {
    if (!this.seleccionadosMain || this.seleccionadosMain.length === 0) return;

    this.blockUI.start('Desasignando personal...');

    try {
      for (const p of this.seleccionadosMain) {
        const ordenTrabajoPersonalId = this.ordenTrabajoPersonalIds.get(p.nEmpleado);

        if (ordenTrabajoPersonalId) {
          await firstValueFrom(
            this.apiService.eliminarOrdenTrabajoPersonal(ordenTrabajoPersonalId)
          );

          console.log(`✅ Personal ${p.cEmpleado} desasignado de la API`);
          this.ordenTrabajoPersonalIds.delete(p.nEmpleado);
        }
      }

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

  // Nueva funcionalidad: Edición de celdas individuales
  async onCellValueChanged(e: any) {
    console.log('🎯 onCellValueChanged DISPARADO');
    console.log('📦 Evento completo:', e);
    console.log('🔑 e.changes:', e.changes);

    if (!e.changes || e.changes.length === 0) {
      console.log('❌ No hay cambios en el evento');
      return;
    }

    // Procesar cada cambio
    for (const change of e.changes) {
      console.log('🔄 Procesando cambio:', change);
      console.log('🔑 change.key:', change.key);
      console.log('📝 change.data:', change.data);
      console.log('🔧 change.type:', change.type);

      if (change.type !== 'update') {
        console.log('⚠️ Tipo de cambio no es update, saltando');
        continue;
      }

      const personalId = change.key;
      const cambios = change.data;

      console.log('👤 PersonalId extraído:', personalId);
      console.log('🔄 Cambios extraídos:', cambios);

      if (!cambios || Object.keys(cambios).length === 0) {
        console.log('❌ No hay cambios en los datos');
        continue;
      }

      // Filtrar solo los cambios en columnas de fecha
      const camposValidos = Object.keys(cambios).filter(key => key.startsWith('d') && key.length === 9);

      console.log('📝 Campos válidos (fechas):', camposValidos);

      if (camposValidos.length === 0) {
        console.log('⚠️ No hay cambios en columnas de fecha, saltando');
        continue;
      }

      // Procesar cada campo de fecha modificado
      for (const field of camposValidos) {
        const nuevoHorarioId = cambios[field];

        console.log('📅 Field:', field);
        console.log('⏰ Nuevo horarioId:', nuevoHorarioId);

        // Validar que el field tenga el formato correcto (d20250107)
        if (!field || !field.startsWith('d') || field.length !== 9) {
          console.log('⚠️ Field no tiene formato de fecha válido, saltando');
          continue;
        }

        // Extraer la fecha del field (formato: d20250107)
        const fechaStr = field.substring(1); // Quitar la 'd'
        const year = parseInt(fechaStr.substring(0, 4));
        const month = parseInt(fechaStr.substring(4, 6)) - 1; // Mes base 0
        const day = parseInt(fechaStr.substring(6, 8));

        console.log('📅 Fecha extraída - Year:', year, 'Month:', month, 'Day:', day);

        const fecha = new Date(year, month, day);

        // Validar que la fecha sea válida
        if (isNaN(fecha.getTime())) {
          console.log('❌ Fecha inválida generada, saltando');
          continue;
        }

        console.log('🔄 Celda editada:', { personalId, fecha: formatDate(fecha, 'yyyy-MM-dd', 'en-US'), nuevoHorarioId });

        // Obtener la fila completa
        const persona = this.personalHorarios.find(p => p.nEmpleado === personalId);

        console.log('👤 Persona encontrada:', persona);

        if (!persona) {
          console.log('❌ No se encontró la persona');
          continue;
        }

        // Verificar si es la primera asignación (todas las otras celdas están vacías)
        const celdasVaciasAntes = this.columnasFechas.filter(col => col.field !== field).every(col => !persona[col.field]);

        console.log('🔍 ¿Celdas vacías antes?:', celdasVaciasAntes);
        console.log('🔍 nuevoHorarioId:', nuevoHorarioId, 'Tipo:', typeof nuevoHorarioId);

        // Validar que nuevoHorarioId sea un número válido
        if (celdasVaciasAntes && nuevoHorarioId && typeof nuevoHorarioId === 'number') {
          console.log('✅ Primera asignación detectada - Rellenando todo el rango');
          // Primera asignación: rellenar todo el rango
          await this.asignarHorarioATodoElRango(personalId, nuevoHorarioId);
          // Actualizar todas las celdas en el grid
          this.columnasFechas.forEach(col => {
            persona[col.field] = nuevoHorarioId;
          });
          this.personalHorarios = [...this.personalHorarios];
        } else if (nuevoHorarioId !== null && nuevoHorarioId !== undefined) {
          console.log('✅ Guardando solo esta celda');
          // Solo guardar esta celda específica
          await this.guardarHorarioIndividual(personalId, fecha, nuevoHorarioId);
        } else {
          console.log('⚠️ nuevoHorarioId es null o undefined, limpiando celda');
          // Si se borró el horario (null), también guardar ese cambio
          await this.guardarHorarioIndividual(personalId, fecha, null);
        }
      } // Cierre del for de camposValidos
    } // Cierre del for de changes

    console.log('✅ onCellValueChanged COMPLETADO');
  }

  async guardarHorarioIndividual(personalId: number, fecha: Date, horarioCabeceraId: number | null) {
    console.log('💾 guardarHorarioIndividual - INICIO');
    console.log('💾 personalId:', personalId);
    console.log('💾 fecha:', fecha);
    console.log('💾 horarioCabeceraId:', horarioCabeceraId);
    console.log('💾 empresaId:', this.empresaId);
    console.log('💾 ordenCombo:', this.ordenCombo);

    try {
      const payload = {
        empresaId: this.empresaId,
        ordenTrabajoCabeceraId: this.ordenCombo,
        personalId: personalId,
        fecha: formatDate(fecha, 'yyyy-MM-dd', 'en-US'),
        horarioCabeceraId: horarioCabeceraId
      };

      console.log('📤 Guardando horario individual:', payload);

      const response = await firstValueFrom(
        this.apiService.guardarOrdenTrabajoHorario(payload)
      );

      console.log('✅ Horario guardado correctamente. Response:', response);

    } catch (error) {
      console.error('❌ Error al guardar horario:', error);
      this.showMessage('Error al guardar el horario');
    }
  }

  async asignarHorarioATodoElRango(personalId: number, horarioCabeceraId: number) {
    console.log('🔄 asignarHorarioATodoElRango - INICIO');
    console.log('👤 personalId:', personalId);
    console.log('⏰ horarioCabeceraId recibido:', horarioCabeceraId);
    console.log('📅 columnasFechas.length:', this.columnasFechas.length);

    // Validación crítica
    if (!horarioCabeceraId || horarioCabeceraId === null || horarioCabeceraId === undefined) {
      console.error('❌ horarioCabeceraId es null o undefined, no se puede asignar');
      this.showMessage('Error: No se puede asignar un horario vacío');
      return;
    }

    try {
      for (const col of this.columnasFechas) {
        const fecha = col.date;
        const payload = {
          empresaId: this.empresaId,
          ordenTrabajoCabeceraId: this.ordenCombo,
          personalId: personalId,
          fecha: formatDate(fecha, 'yyyy-MM-dd', 'en-US'),
          horarioCabeceraId: horarioCabeceraId
        };

        console.log('📤 Enviando payload para fecha:', formatDate(fecha, 'yyyy-MM-dd', 'en-US'), 'Payload:', payload);

        await firstValueFrom(
          this.apiService.guardarOrdenTrabajoHorario(payload)
        );
      }

      console.log('✅ Horario asignado a todo el rango exitosamente');

    } catch (error) {
      console.error('❌ Error al asignar horario al rango:', error);
      throw error;
    }
  }

  // Nueva funcionalidad: Asignación masiva de horario
  async asignarHorarioMasivo() {
    if (!this.horarioSeleccionadoMasivo) {
      this.showMessage('Selecciona un horario primero');
      return;
    }

    if (!this.seleccionadosMain || this.seleccionadosMain.length === 0) {
      this.showMessage('Selecciona al menos una persona');
      return;
    }

    this.blockUI.start('Asignando horario...');

    try {
      for (const persona of this.seleccionadosMain) {
        await this.asignarHorarioATodoElRango(persona.nEmpleado, this.horarioSeleccionadoMasivo);

        // Actualizar en el grid
        this.columnasFechas.forEach(col => {
          persona[col.field] = this.horarioSeleccionadoMasivo;
        });
      }

      this.personalHorarios = [...this.personalHorarios];
      this.showMessage(`Horario asignado a ${this.seleccionadosMain.length} persona(s)`);
      this.seleccionadosMain = [];
      this.horarioSeleccionadoMasivo = null;

    } catch (error) {
      console.error('❌ Error al asignar horario masivo:', error);
      this.showMessage('Error al asignar el horario');
    } finally {
      this.blockUI.stop();
    }
  }

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
