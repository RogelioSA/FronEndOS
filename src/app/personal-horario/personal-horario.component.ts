import { Component, ViewChild, ElementRef } from '@angular/core';
import { formatDate } from '@angular/common';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../services/api.service';
import * as XLSX from 'xlsx';

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

  // Mapa para almacenar los IDs de OrdenTrabajoHorario por personalId + fecha
  ordenTrabajoHorarioIds: Map<string, number> = new Map();

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
  private normalizarDni(valor: any): string {
    if (valor == null) return '';
    // Convierte a string y deja solo dígitos
    return String(valor).replace(/\D/g, '').trim();
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
    this.ordenTrabajoHorarioIds.clear();
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
    const dias = ['Do','Lu','Ma','Mi','Ju','Vi','Sa'];
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

      console.log('📅 Cargando horarios asignados:', {
        ordenId: this.ordenCombo,
        inicio,
        fin
      });

      const response = await firstValueFrom(
        this.apiService.obtenerHorariosPorOrdenYRango(this.ordenCombo, inicio, fin)
      );

      console.log('✅ Horarios asignados recibidos:', response);

      // Limpiar el mapa antes de llenarlo
      this.ordenTrabajoHorarioIds.clear();

      // Mapear los horarios a las celdas correspondientes
      for (const horario of response) {
        const personalId = horario.personalId;
        const [year, month, day] = horario.fecha.split('-').map(Number);
        const fecha = new Date(year, month - 1, day); // esto usa la hora local sin desplazamiento UTC
        const field = 'd' + formatDate(fecha, 'yyyyMMdd', 'en-US', '+0000');

        // Guardar el ID del registro para futuros PUT
        const key = `${personalId}_${formatDate(fecha, 'yyyy-MM-dd', 'en-US')}`;
        this.ordenTrabajoHorarioIds.set(key, horario.id);
        console.log(field);
        const persona = this.personalHorarios.find(p => p.nEmpleado === personalId);
        if (persona && persona.hasOwnProperty(field)) {
          persona[field] = horario.horarioCabeceraId;
        }
      }

      this.personalHorarios = [...this.personalHorarios];
      console.log(this.personalHorarios);
      console.log('✅ Horarios aplicados al grid');

    } catch (error) {
      console.error('❌ Error al cargar horarios asignados:', error);
    }
  }

  async cargarPersonalDisponible() {
    try {
      const todosPersonal: any[] = await firstValueFrom(this.apiService.getPersonal());

      const asignadosIds = this.personalHorarios.map(p => p.nEmpleado);

      this.personalDisponibles = todosPersonal
        .filter(p => !asignadosIds.includes(p.id))
        .map(p => ({
          nEmpleado: p.id,
          cEmpleado: p.nombreCompleto || `${p.nombre} ${p.apellidoPaterno || ''}`.trim(),
          documentoIdentidad: p.documentoIdentidad   // 👈 DNI guardado aquí
        }));

      console.log('✅ Personal disponible cargado:', this.personalDisponibles);

    } catch (error) {
      console.error('❌ Error al cargar personal disponible:', error);
    }
  }


  onDisponiblesSelectionChanged(e: any) {
    this.seleccionDisponibles = e.selectedRowsData;
    this.hayDisponiblesSeleccionados = this.seleccionDisponibles.length > 0;
  }

  async agregarSeleccionados() {
    if (!this.seleccionDisponibles || this.seleccionDisponibles.length === 0) {
      this.showMessage('Selecciona personal primero');
      return;
    }

    this.blockUI.start('Agregando personal...');

    try {
      const ordenTrabajoPersonalId = this.ordenTrabajoPersonalIds.get(this.seleccionDisponibles[0].nEmpleado);

      for (const persona of this.seleccionDisponibles) {
        const payload = {
          empresaId: this.empresaId,
          ordenTrabajoCabeceraId: this.ordenCombo,
          personaId: persona.nEmpleado,
          esLider: false
        };

        const response = await firstValueFrom(
          this.apiService.crearOrdenTrabajoPersonal(payload)
        );

        if (response && response.id) {
          this.ordenTrabajoPersonalIds.set(persona.nEmpleado, response.id);
        }

        const row: any = {
          nEmpleado: persona.nEmpleado,
          cEmpleado: persona.cEmpleado,
          esLider: false
        };

        for (const col of this.columnasFechas) {
          row[col.field] = null;
        }

        this.personalHorarios.push(row);
      }

      this.personalDisponibles = this.personalDisponibles.filter(
        d => !this.seleccionDisponibles.some(s => s.nEmpleado === d.nEmpleado)
      );

      this.personalHorarios = [...this.personalHorarios];
      this.personalDisponibles = [...this.personalDisponibles];

      this.showMessage(`${this.seleccionDisponibles.length} persona(s) agregada(s)`);
      this.seleccionDisponibles = [];
      this.hayDisponiblesSeleccionados = false;

    } catch (error) {
      console.error('❌ Error al agregar personal:', error);
      this.showMessage('Error al agregar el personal');
    } finally {
      this.blockUI.stop();
    }
  }

  onMainGridSelectionChanged(e: any) {
    this.seleccionadosMain = e.selectedRowsData;
  }

  async desasignarSeleccionados() {
    if (!this.seleccionadosMain || this.seleccionadosMain.length === 0) {
      this.showMessage('Selecciona personal primero');
      return;
    }

    this.blockUI.start('Desasignando personal...');

    try {
      for (const persona of this.seleccionadosMain) {
        const ordenTrabajoPersonalId = this.ordenTrabajoPersonalIds.get(persona.nEmpleado);

        if (ordenTrabajoPersonalId) {
          await firstValueFrom(
            this.apiService.eliminarOrdenTrabajoPersonal(ordenTrabajoPersonalId)
          );

          this.ordenTrabajoPersonalIds.delete(persona.nEmpleado);
        }

        this.personalDisponibles.push({
          nEmpleado: persona.nEmpleado,
          cEmpleado: persona.cEmpleado
        });
      }

      this.personalHorarios = this.personalHorarios.filter(
        p => !this.seleccionadosMain.some(s => s.nEmpleado === p.nEmpleado)
      );

      this.personalDisponibles = [...this.personalDisponibles];
      this.personalHorarios = [...this.personalHorarios];

      this.showMessage(`${this.seleccionadosMain.length} persona(s) desasignada(s)`);
      this.seleccionadosMain = [];

    } catch (error) {
      console.error('❌ Error al desasignar personal:', error);
      this.showMessage('Error al desasignar el personal');
    } finally {
      this.blockUI.stop();
    }
  }

  async onCellValueChanged(e: any) {
    console.log('🔄 onCellValueChanged (onRowUpdating) DISPARADO');
    console.log('📝 e.newData:', e.newData);
    console.log('📝 e.oldData:', e.oldData);
    console.log('📝 e.key:', e.key);


    if (!e.newData || Object.keys(e.newData).length === 0) {
      console.log('❌ No hay cambios en newData');
      return;
    }


    const personalId = e.key;
    const cambios = e.newData;


    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 PersonalId:', personalId);
    console.log('🔄 Cambios detectados:', cambios);


    // Filtrar solo los campos de fecha (d20250107)
    const camposValidos = Object.keys(cambios).filter(key => key.startsWith('d') && key.length === 9);


    console.log('📝 Campos de fecha modificados:', camposValidos);


    if (camposValidos.length === 0) {
      console.log('⚠️ No hay cambios en columnas de fecha');
      return;
    }


    const field = camposValidos[0];
    const nuevoHorarioId = cambios[field];


    console.log('📅 Field detectado:', field);
    console.log('⏰ Nuevo horarioId:', nuevoHorarioId);


    // Buscar la columna correspondiente
    const columna = this.columnasFechas.find(col => col.field === field);

    if (!columna) {
      console.log('❌ No se encontró la columna para el field:', field);
      return;
    }


    console.log('✅ Columna encontrada:', {
      field: columna.field,
      caption: columna.caption,
      date: columna.date.toISOString(),
      year: columna.date.getFullYear(),
      month: columna.date.getMonth() + 1,
      day: columna.date.getDate()
    });


    const fecha = columna.date;


    // Guardar solo esta celda específica
    await this.guardarHorarioIndividual(personalId, fecha, nuevoHorarioId);

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
      const fechaStr = formatDate(fecha, 'yyyy-MM-dd', 'en-US');
      const key = `${personalId}_${fechaStr}`;
      const horarioId = this.ordenTrabajoHorarioIds.get(key);

      const payload = {
        empresaId: this.empresaId,
        ordenTrabajoCabeceraId: this.ordenCombo,
        personalId: personalId,
        fecha: fechaStr,
        horarioCabeceraId: horarioCabeceraId
      };

      console.log('📤 Payload:', JSON.stringify(payload, null, 2));

      let response;

      if (horarioId) {
        // Ya existe un registro, hacer PUT
        console.log('🔄 Actualizando registro existente con PUT. ID:', horarioId);
        response = await firstValueFrom(
          this.apiService.actualizarOrdenTrabajoHorario(horarioId, payload)
        );
        console.log('✅ Horario actualizado correctamente. Response:', response);
      } else {
        // No existe, hacer POST
        console.log('➕ Creando nuevo registro con POST');
        response = await firstValueFrom(
          this.apiService.guardarOrdenTrabajoHorario(payload)
        );

        // Guardar el ID del nuevo registro
        if (response && response.id) {
          this.ordenTrabajoHorarioIds.set(key, response.id);
        }

        console.log('✅ Horario guardado correctamente. Response:', response);
      }

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
        await this.guardarHorarioIndividual(personalId, fecha, horarioCabeceraId);
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
  async onExcelAsignacionChange(event: any) {
  const file: File = event.target.files?.[0];
  if (!file) {
    return;
  }

  // Validación básica
  if (this.personalDisponibles.length === 0) {
    this.showMessage('No hay personal disponible cargado para asignar.');
    return;
  }

  this.blockUI.start('Procesando Excel...');

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Tomamos la primera hoja (ajusta si necesitas otra)
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Leemos como matriz (array de filas) porque tu encabezado "DNI" está en la F, fila 2
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (!rows || rows.length < 3) {
      this.showMessage('El Excel no tiene filas suficientes para procesar.');
      return;
    }

    // Fila de encabezados es la segunda fila → índice 1
    const headerRow = rows[1];
    if (!headerRow) {
      this.showMessage('No se encontró la fila de encabezados (fila 2).');
      return;
    }

    // Buscar la columna cuyo encabezado sea "DNI"
    const dniColIndex = headerRow.findIndex((v: any) =>
      String(v ?? '').trim().toUpperCase() === 'DNI'
    );

    if (dniColIndex === -1) {
      this.showMessage('No se encontró la columna DNI en la fila 2 del Excel.');
      return;
    }

    // Las filas de datos empiezan desde la fila 3 → índice 2
    const dniListaExcel: string[] = rows
      .slice(2)
      .map(row => this.normalizarDni(row[dniColIndex]))
      .filter(d => d.length > 0);

    if (dniListaExcel.length === 0) {
      this.showMessage('No se encontraron DNIs válidos en el Excel.');
      return;
    }

    console.log('📄 DNIs encontrados en Excel:', dniListaExcel);

    // Mapa DNI → persona disponible
    const mapaDisponiblesPorDni = new Map<string, any>();
    for (const p of this.personalDisponibles) {
      const dni = this.normalizarDni(p.documentoIdentidad);
      if (dni) {
        // Si hay duplicados, se queda el primero (o podrías manejar colisiones)
        if (!mapaDisponiblesPorDni.has(dni)) {
          mapaDisponiblesPorDni.set(dni, p);
        }
      }
    }

    const seleccionDesdeExcel: any[] = [];
    const noEncontrados: string[] = [];

    for (const dni of dniListaExcel) {
      const persona = mapaDisponiblesPorDni.get(dni);
      if (persona) {
        seleccionDesdeExcel.push(persona);
      } else {
        noEncontrados.push(dni);
      }
    }

    if (seleccionDesdeExcel.length === 0) {
      this.showMessage('Ningún DNI del Excel coincide con el personal disponible.');
      console.warn('DNIs no encontrados:', noEncontrados);
      return;
    }

    // Actualizamos la selección como si se hubiera hecho manualmente desde la grilla
    this.seleccionDisponibles = seleccionDesdeExcel;
    this.hayDisponiblesSeleccionados = this.seleccionDisponibles.length > 0;

    console.log('✅ Personas seleccionadas desde Excel:', this.seleccionDisponibles);
    if (noEncontrados.length > 0) {
      console.warn('⚠️ DNIs del Excel sin coincidencia en personal disponible:', noEncontrados);
    }

    // Reutilizamos TU lógica actual de asignación
    await this.agregarSeleccionados();

  } catch (err) {
    console.error('❌ Error procesando Excel de asignación masiva:', err);
    this.showMessage('Error al procesar el archivo Excel.');
  } finally {
    this.blockUI.stop();
    // Opcional: limpiar el input de archivo
    event.target.value = null;
  }
}

@ViewChild('fileExcelMasivo') fileExcelMasivo!: ElementRef<HTMLInputElement>;

btnExcelMasivoClick() {
  if (this.fileExcelMasivo) {
    this.fileExcelMasivo.nativeElement.click();
  }
}

}
