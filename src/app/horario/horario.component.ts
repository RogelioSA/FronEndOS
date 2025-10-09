import { Component, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DxDataGridComponent, DxTreeListComponent } from 'devextreme-angular';

@Component({
    selector: 'app-horario',
    templateUrl: './horario.component.html',
    styleUrl: './horario.component.css',
    standalone: false
})
export class HorarioComponent {

  horarios : [] = [];
  filasSeleccionadasDescanso : any[] = [];
  filasSeleccionadasHorario : any[] = [];
  diasDisponibles: any[] = [];
  diaSeleccionado: number | null = null;
  todosLosDetalles: any[] = [];
  descansos: any[] = [];
  idHorarioActual: number | null = null;
  empresaId: number = 1;

  desactivarTreeList: boolean = true;

  @ViewChild('dataGrid', { static: false }) dataGrid!: DxDataGridComponent;
  @ViewChild('treeList', { static: false }) treeList!: DxTreeListComponent;

  @BlockUI() blockUI!: NgBlockUI;


  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    await this.traerDescansos();

  }


  async traerDescansos() {
    this.blockUI.start('Cargando...');
  
    console.log("📅 Trayendo descansos...");
  
    try {
      const obser = this.apiService.getHorarios();
      const result = await firstValueFrom(obser);
  
      // 🔹 Mapea los horarios al formato que usa tu grid
      this.horarios = result.map((h: any) => {
        // Buscar el detalle principal (por ejemplo, el primer día o el primero de la lista)
        const detalle = h.horarioDetalles?.[0];
        const eventos = detalle?.horarioDetalleEventos || [];
  
        // Buscar eventos de entrada y salida
        const entrada = eventos.find((e: any) => e.tipoEvento === 0); // entrada
        const salida = eventos.find((e: any) => e.tipoEvento === 1);  // salida
  
        return {
          nCodigo: h.id,
          cNombre: h.nombre,
          cDescripcion: h.descripcion,
          cEntrada: entrada?.hora || null,
          cInicioEntrada: null, // si luego deseas mapear las ventanas min/max
          cFinalEntrada: null,
          cSalida: salida?.hora || null,
          cInicioSalida: null,
          cFinalSalida: null,
          nDiasTrabajo: h.horarioDetalles?.length || 0,
        };
      });
  
      console.log("✅ Horarios cargados:", this.horarios);
    } catch (error) {
      console.error('❌ Error trayendo los descansos:', error);
    } finally {
      this.blockUI.stop();
    }
  }

  mostrarDetalleHorario(e: any) {
    const filaSeleccionada = e.selectedRowsData?.[0];
    if (!filaSeleccionada) {
      this.descansos = [];
      this.diasDisponibles = [];
      this.diaSeleccionado = null;
      this.idHorarioActual = null;
      return;
    }
  
    const idHorario = filaSeleccionada.nCodigo;
    this.idHorarioActual = idHorario;
    console.log("🕓 Horario seleccionado:", idHorario);
  
    // 🔹 Llamada al servicio que trae los horarios
    this.apiService.getHorarios().subscribe({
      next: (result: any[]) => {
        const horario = result.find((h) => h.id === idHorario);
        if (!horario) {
          console.warn("⚠️ No se encontró el horario con ID:", idHorario);
          this.descansos = [];
          this.generarDiasDisponibles([]);
          return;
        }
  
        // Guardar todos los detalles de todos los días
        this.todosLosDetalles = horario.horarioDetalles || [];
  
        // Generar siempre 7 días disponibles
        this.generarDiasDisponibles(this.todosLosDetalles);
  
        console.log("📅 Días disponibles:", this.diasDisponibles);
  
        // Limpiar selección previa
        this.diaSeleccionado = null;
        this.descansos = [];
      },
      error: (err) => {
        console.error("❌ Error trayendo detalles del horario:", err);
      }
    });
  }

  generarDiasDisponibles(detalles: any[]) {
    this.diasDisponibles = [];
    for (let i = 1; i <= 7; i++) {
      const detalleExistente = detalles.find((d: any) => d.diaSemana === i);
      this.diasDisponibles.push({
        diaSemana: i,
        nombre: `Día ${i}`,
        existe: !!detalleExistente
      });
    }
  }
  
  // 🔹 Cuando el usuario selecciona un día
  onDiaSeleccionado(e: any) {
    const dia = e.value;
    this.diaSeleccionado = dia;
  
    const detalle = this.todosLosDetalles.find((d: any) => d.diaSemana === dia);
    
    if (!detalle) {
      // Si no existe detalle para este día, mostrar una fila vacía para crear
      this.descansos = [
        {
          nCodigo: null,
          cNombre: `Día ${dia}`,
          cHoraInicial: null,
          cHoraFinal: null,
          nDuracion: 0,
          esNuevo: true,
          diaSemana: dia,
          idHorario: this.idHorarioActual
        }
      ];
      console.log(`⚠️ No hay datos para el Día ${dia}, permitiendo crear nuevo registro`);
      return;
    }
  
    const eventos = detalle.horarioDetalleEventos || [];
  
    // Combinar evento de entrada (tipoEvento = 0) y salida (tipoEvento = 1)
    const entrada = eventos.find((e: any) => e.tipoEvento === 0);
    const salida = eventos.find((e: any) => e.tipoEvento === 1);
  
    this.descansos = [
      {
        nCodigo: detalle.id,
        cNombre: `Día ${detalle.diaSemana}`,
        cHoraInicial: entrada?.hora || null,
        cHoraFinal: salida?.hora || null,
        nDuracion: salida?.ventanaMax ?? entrada?.ventanaMax ?? 0,
        esNuevo: false,
        diaSemana: dia,
        idHorario: this.idHorarioActual
      }
    ];
  
    console.log(`✅ Detalles del Día ${dia}:`, this.descansos);
  }
  

  guardar(event : any){
    console.log(event);
  }

  actualizar(event : any){
    const idHorario = event.oldData.nCodigo;
    const nuevosDatos = event.newData;

    // Construir la estructura esperada por el API
    const datos = {
      cabecera: {
        empresaId: this.empresaId,
        nombre: nuevosDatos.cNombre || event.oldData.cNombre,
        descripcion: nuevosDatos.cDescripcion || event.oldData.cDescripcion || '',
        activo: true
      },
      detalles: this.construirDetallesDesdeHorario(idHorario)
    };

    this.apiService.updateHorario(idHorario, datos).subscribe(
      (response: any) => {
        console.log('✅ Horario actualizado correctamente:', response);
        // Recargar la lista de horarios
        this.traerDescansos();
      },
      (error: any) => {
        console.error('❌ Error al actualizar horario.', error);
      }
    );

    console.log('Actualizando horario:', datos);
  }

  insertar(event : any){

    // Construir la estructura esperada por el API
    const datos = {
      cabecera: {
        empresaId: this.empresaId,
        nombre: event.data.cNombre,
        descripcion: event.data.cDescripcion || '',
        activo: true
      },
      detalles: this.construirDetalles(event.data.nDiasTrabajo)
    };

    this.apiService.createHorario(datos).subscribe(
      (response: any) => {
        console.log('✅ Horario insertado correctamente:', response);
        // Recargar la lista de horarios
        this.traerDescansos();
      },
      (error: any) => {
        console.error('❌ Error al insertar horario.', error);
      }
    );

    console.log('Insertando horario:', datos);
  }

  formatearHora(hora: any): string {
    if (!hora) return '08:00:00';
    
    // Si ya está en formato HH:mm:ss, devolverlo
    if (typeof hora === 'string' && hora.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return hora;
    }
    
    // Si es una fecha/objeto
    if (hora instanceof Date) {
      const horas = String(hora.getHours()).padStart(2, '0');
      const minutos = String(hora.getMinutes()).padStart(2, '0');
      const segundos = String(hora.getSeconds()).padStart(2, '0');
      return `${horas}:${minutos}:${segundos}`;
    }
    
    // Si es string pero no en formato correcto
    if (typeof hora === 'string') {
      return hora.includes(':') ? hora : '08:00:00';
    }
    
    return '08:00:00';
  }

  construirDetalles(nDiasTrabajo: number): any[] {
    const detalles = [];
    
    // Si no se especifica, crear detalles para los días seleccionados en el tree-list
    if (this.filasSeleccionadasDescanso.length > 0) {
      this.filasSeleccionadasDescanso.forEach((descanso: any, index: number) => {
        const detalle = {
          empresaId: this.empresaId,
          item: index + 1,
          diaSemana: descanso.diaSemana || index + 1,
          eventos: [
            {
              id: 0,
              empresaId: this.empresaId,
              tipoEvento: 0, // Entrada
              hora: this.formatearHora(descanso.cHoraInicial),
              diferenciaDia: 0,
              ventanaMin: 75,
              ventanaMax: 75
            },
            {
              id: 0,
              empresaId: this.empresaId,
              tipoEvento: 1, // Salida
              hora: this.formatearHora(descanso.cHoraFinal),
              diferenciaDia: 0,
              ventanaMin: 75,
              ventanaMax: 75
            }
          ]
        };
        detalles.push(detalle);
      });
    } else {
      // Si no hay detalles seleccionados, crear días vacíos
      for (let i = 1; i <= (nDiasTrabajo || 5); i++) {
        const detalle = {
          empresaId: this.empresaId,
          item: i,
          diaSemana: i,
          eventos: []
        };
        detalles.push(detalle);
      }
    }
    
    return detalles;
  }

  construirDetallesDesdeHorario(idHorario: number): any[] {
    // Buscar el horario actual en la lista de horarios
    const horarioData: any = this.horarios.find((h: any) => h.nCodigo === idHorario);
    
    if (!horarioData || !this.todosLosDetalles.length) {
      return [];
    }

    const detalles = this.todosLosDetalles.map((detalle: any, index: number) => {
      const eventos = detalle.horarioDetalleEventos || [];
      
      const entrada = eventos.find((e: any) => e.tipoEvento === 0);
      const salida = eventos.find((e: any) => e.tipoEvento === 1);

      return {
        id: detalle.id,
        empresaId: this.empresaId,
        item: detalle.item || index + 1,
        diaSemana: detalle.diaSemana,
        eventos: [
          {
            id: entrada?.id || 0,
            empresaId: this.empresaId,
            tipoEvento: 0, // Entrada
            hora: this.formatearHora(entrada?.hora),
            diferenciaDia: entrada?.diferenciaDia || 0,
            ventanaMin: entrada?.ventanaMin || 75,
            ventanaMax: entrada?.ventanaMax || 75
          },
          {
            id: salida?.id || 0,
            empresaId: this.empresaId,
            tipoEvento: 1, // Salida
            hora: this.formatearHora(salida?.hora),
            diferenciaDia: salida?.diferenciaDia || 0,
            ventanaMin: salida?.ventanaMin || 75,
            ventanaMax: salida?.ventanaMax || 75
          }
        ]
      };
    });

    return detalles;
  }

  eliminar(event : any){
    let registro = {
      nCodigo : event.data.nCodigo,
      cTipo : "eliminar"
    };

    this.apiService.sincronizarHorario(registro).subscribe(
      (response: any) => {
      },
      (error: any) => {
        console.error('Error al eliminar registro.', error);
      }
    );

    console.log(registro);

    console.log(event);
    
  }

  iniciaEdicion(event: any){
    //console.log('inicia la edicion',event);

    this.filasSeleccionadasHorario = [event.data.nCodigo];

    this.desactivarTreeList = false;
  }

  cancelaEdicion(event: any){
    //console.log('cancela la edicion');
    this.desactivarTreeList = true;
  }

  agregarNuevaFila(event: any){
    //console.log('agrega fila');
    this.desactivarTreeList = false;

    this.filasSeleccionadasHorario = [];
    this.filasSeleccionadasDescanso = [];
  }

  async traerHorarioDescanso(rol : number){
    console.log("traer horarioDescansos");

    try{
      const obser = this.apiService.getHorarioDescansos(rol);
      const result = await firstValueFrom(obser);

      this.filasSeleccionadasDescanso = result.data;
    }catch(error){
      console.log('Error traendo los horarioDescansos.')
    }finally{
    }
  }

  async onSelectionChangedGrid(event: any) {
    if(event.selectedRowsData.length > 0){
      await this.traerHorarioDescanso(event.selectedRowsData[0].nCodigo);
    }else{
      this.filasSeleccionadasDescanso = [];
    }
  }

  guardando(event : any){

    if(event.changes.length === 0){

      let registro = {
        nCodigo: this.filasSeleccionadasHorario[0],
        descansos: this.filasSeleccionadasDescanso,
        cTipo: "actualizar"
      }

      this.apiService.sincronizarHorario(registro).subscribe(
        (response: any) => {
        },
        (error: any) => {
          console.error('Error al insertar registro.', error);
        }
      );

      console.log('guardando',event);
    }

  }

  // Métodos para el dx-tree-list (Descansos/Detalles)

  actualizarDescanso(event: any) {
    const idHorario = this.idHorarioActual;
    const nuevosDatos = event.newData;

    // Construir la estructura completa del horario actualizado
    const datos = {
      cabecera: {
        empresaId: this.empresaId,
        nombre: '',
        descripcion: '',
        activo: true
      },
      detalles: this.construirDetallesConDescansoActualizado(nuevosDatos, event.oldData)
    };

    this.apiService.updateHorario(idHorario!, datos).subscribe(
      (response: any) => {
        console.log('✅ Descanso actualizado correctamente:', response);
        // Recargar los detalles del horario
        this.mostrarDetalleHorario({ selectedRowsData: [{ nCodigo: this.idHorarioActual }] });
      },
      (error: any) => {
        console.error('❌ Error al actualizar descanso.', error);
      }
    );

    console.log('Actualizando descanso:', datos);
  }

  construirDetallesConDescansoActualizado(nuevosDatos: any, datosAntiguos: any): any[] {
    const detalles = this.todosLosDetalles.map((detalle: any) => {
      // Si es el detalle que estamos editando
      if (detalle.id === datosAntiguos.nCodigo) {
        const eventos = detalle.horarioDetalleEventos || [];
        const entrada = eventos.find((e: any) => e.tipoEvento === 0);
        const salida = eventos.find((e: any) => e.tipoEvento === 1);

        return {
          id: detalle.id,
          empresaId: this.empresaId,
          item: detalle.item,
          diaSemana: nuevosDatos.diaSemana || detalle.diaSemana,
          eventos: [
            {
              id: entrada?.id || 0,
              empresaId: this.empresaId,
              tipoEvento: 0,
              hora: this.formatearHora(nuevosDatos.cHoraInicial || entrada?.hora),
              diferenciaDia: entrada?.diferenciaDia || 0,
              ventanaMin: 75,
              ventanaMax: 75
            },
            {
              id: salida?.id || 0,
              empresaId: this.empresaId,
              tipoEvento: 1,
              hora: this.formatearHora(nuevosDatos.cHoraFinal || salida?.hora),
              diferenciaDia: salida?.diferenciaDia || 0,
              ventanaMin: 75,
              ventanaMax: 75
            }
          ]
        };
      }

      // Para otros detalles, mantener los datos existentes
      const eventos = detalle.horarioDetalleEventos || [];
      const entrada = eventos.find((e: any) => e.tipoEvento === 0);
      const salida = eventos.find((e: any) => e.tipoEvento === 1);

      return {
        id: detalle.id,
        empresaId: this.empresaId,
        item: detalle.item,
        diaSemana: detalle.diaSemana,
        eventos: [
          {
            id: entrada?.id || 0,
            empresaId: this.empresaId,
            tipoEvento: 0,
            hora: this.formatearHora(entrada?.hora),
            diferenciaDia: entrada?.diferenciaDia || 0,
            ventanaMin: entrada?.ventanaMin || 75,
            ventanaMax: entrada?.ventanaMax || 75
          },
          {
            id: salida?.id || 0,
            empresaId: this.empresaId,
            tipoEvento: 1,
            hora: this.formatearHora(salida?.hora),
            diferenciaDia: salida?.diferenciaDia || 0,
            ventanaMin: salida?.ventanaMin || 75,
            ventanaMax: salida?.ventanaMax || 75
          }
        ]
      };
    });

    return detalles;
  }

  insertarDescanso(event: any) {
    // Crear la estructura completa del horario con el nuevo descanso
    const nuevoDescanso = event.data;
    
    // Obtener el día seleccionado desde el nuevo descanso o usar el diaSeleccionado
    const diaDelDescanso = nuevoDescanso.diaSemana || this.diaSeleccionado;
    
    // Agregar el nuevo descanso a la lista
    this.filasSeleccionadasDescanso.push({
      cHoraInicial: nuevoDescanso.cHoraInicial,
      cHoraFinal: nuevoDescanso.cHoraFinal,
      nDuracion: nuevoDescanso.nDuracion,
      diaSemana: diaDelDescanso
    });

    const datos = {
      cabecera: {
        empresaId: this.empresaId,
        nombre: '',
        descripcion: '',
        activo: true
      },
      detalles: [
        {
          empresaId: this.empresaId,
          item: 1,
          diaSemana: diaDelDescanso,
          eventos: [
            {
              id: 0,
              empresaId: this.empresaId,
              tipoEvento: 0, // Entrada
              hora: this.formatearHora(nuevoDescanso.cHoraInicial),
              diferenciaDia: 0,
              ventanaMin: 75,
              ventanaMax: 75
            },
            {
              id: 0,
              empresaId: this.empresaId,
              tipoEvento: 1, // Salida
              hora: this.formatearHora(nuevoDescanso.cHoraFinal),
              diferenciaDia: 0,
              ventanaMin: 75,
              ventanaMax: 75
            }
          ]
        }
      ]
    };

    this.apiService.createHorario(datos).subscribe(
      (response: any) => {
        console.log('✅ Descanso insertado correctamente:', response);
        // Recargar los detalles del horario para actualizar la lista
        this.mostrarDetalleHorario({ selectedRowsData: [{ nCodigo: this.idHorarioActual }] });
      },
      (error: any) => {
        console.error('❌ Error al insertar descanso.', error);
      }
    );

    console.log('Insertando descanso:', datos);
  }

  eliminarDescanso(event: any) {
    let registro = {
      nCodigo: event.data.nCodigo,
      cTipo: "eliminar_descanso",
      idHorario: this.idHorarioActual,
      diaSemana: this.diaSeleccionado,
      empresaId: this.empresaId
    };

    this.apiService.sincronizarHorario(registro).subscribe(
      (response: any) => {
        console.log('✅ Descanso eliminado:', response);
      },
      (error: any) => {
        console.error('❌ Error al eliminar descanso.', error);
      }
    );

    console.log('Eliminando descanso:', registro);
  }

  guardandoDescanso(event: any) {
    console.log('Guardando cambios en descanso:', event);
  }

  iniciaEdicionDescanso(event: any) {
    console.log('Inicia edición de descanso:', event);
  }

  cancelaEdicionDescanso(event: any) {
    console.log('Cancelada edición de descanso:', event);
  }

  agregarNuevaFilaDescanso(event: any) {
    console.log('Agregando nueva fila de descanso:', event);
  }

}