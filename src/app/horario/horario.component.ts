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

  horarios: any[] = [];
  detallesEventos: any[] = [];
  filasSeleccionadasHorario: any[] = [];
  idHorarioActual: number | null = null;
  empresaId: number = 1;

  @ViewChild('dataGrid', { static: false }) dataGrid!: DxDataGridComponent;
  @ViewChild('detalleGrid', { static: false }) detalleGrid!: DxDataGridComponent;

  @BlockUI() blockUI!: NgBlockUI;

  diasSemana = [
    { id: 1, nombre: 'Lunes' },
    { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miércoles' },
    { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' },
    { id: 6, nombre: 'Sábado' },
    { id: 7, nombre: 'Domingo' }
  ];

  tiposEvento = [
    { id: 0, nombre: 'Entrada' },
    { id: 1, nombre: 'Entrada' },
    { id: 2, nombre: 'Salida' }
  ];

  // Función para manejar el cambio de días de trabajo
  onDiasTrabajoChanged = (newData: any, value: any, currentRowData: any) => {
    newData.nDiasTrabajo = value;
    
    // Si es una nueva fila o se está editando
    if (value && value > 0 && value <= 7) {
      // Aquí podrías generar automáticamente los días si lo deseas
      console.log(`📅 Se configuraron ${value} días de trabajo`);
    }
  };

  constructor(private apiService: ApiService){}

  async ngOnInit(): Promise<void> {
    await this.traerHorarios();
  }

  async traerHorarios() {
    this.blockUI.start('Cargando...');
    console.log("📅 Trayendo horarios...");
  
    try {
      const obser = this.apiService.getHorarios();
      const result = await firstValueFrom(obser);
  
      this.horarios = result.map((h: any) => ({
        nCodigo: h.id,
        cNombre: h.nombre,
        cDescripcion: h.descripcion,
        nDiasTrabajo: h.horarioDetalles?.length || 0,
        horarioDetalles: h.horarioDetalles
      }));
  
      console.log("✅ Horarios cargados:", this.horarios);
    } catch (error) {
      console.error('❌ Error trayendo los horarios:', error);
    } finally {
      this.blockUI.stop();
    }
  }

  mostrarDetalleHorario(e: any) {
    const filaSeleccionada = e.selectedRowsData?.[0];
    
    if (!filaSeleccionada) {
      this.detallesEventos = [];
      this.idHorarioActual = null;
      return;
    }
  
    this.idHorarioActual = filaSeleccionada.nCodigo;
    console.log("🕓 Horario seleccionado:", this.idHorarioActual);
  
    const horario = this.horarios.find(h => h.nCodigo === this.idHorarioActual);
    
    if (!horario || !horario.horarioDetalles) {
      this.detallesEventos = [];
      return;
    }

    // Convertir la estructura de detalles a eventos individuales
    this.detallesEventos = [];
    horario.horarioDetalles.forEach((detalle: any) => {
      const eventos = detalle.horarioDetalleEventos || [];
      
      eventos.forEach((evento: any) => {
        this.detallesEventos.push({
          keyUnico: `${detalle.id}-${evento.id}`, // Key único para el grid
          detalleId: detalle.id,
          eventoId: evento.id,
          diaSemana: detalle.diaSemana,
          nombreDia: this.obtenerNombreDia(detalle.diaSemana),
          tipoEvento: (evento.tipoEvento === 0 || evento.tipoEvento === 1) ? 1 : 2,         
          hora: this.formatearHora(evento.hora),
          diferenciaDia: evento.diferenciaDia || 0,
          ventanaMin: evento.ventanaMin || 75,
          ventanaMax: evento.ventanaMax || 75
        });
      });
    });

    console.log("✅ Eventos cargados:", this.detallesEventos);
  }

  obtenerNombreDia(diaSemana: number): string {
    const dia = this.diasSemana.find(d => d.id === diaSemana);
    return dia ? dia.nombre : `Día ${diaSemana}`;
  }

  actualizar(event: any) {
    const idHorario = event.oldData.nCodigo;
    const nuevosDatos = event.newData;
  
    // Si se cambió el número de días, generar días automáticamente
    let detallesParaEnviar = this.construirDetallesDesdeHorario(idHorario);
    
    if (nuevosDatos.nDiasTrabajo && nuevosDatos.nDiasTrabajo !== event.oldData.nDiasTrabajo) {
      detallesParaEnviar = this.generarDiasAutomaticos(nuevosDatos.nDiasTrabajo);
    }

    const datos = {
      id: idHorario, // 🔥 Agregar el ID en el body
      empresaId: this.empresaId,
      nombre: nuevosDatos.cNombre || event.oldData.cNombre,
      descripcion: nuevosDatos.cDescripcion || event.oldData.cDescripcion || '',
      activo: true,
      detalles: detallesParaEnviar
    };
  
    this.apiService.updateHorario(idHorario, datos).subscribe(
      (response: any) => {
        console.log('✅ Horario actualizado correctamente:', response);
        this.traerHorarios().then(() => {
          // Reseleccionar el horario
          this.mostrarDetalleHorario({ 
            selectedRowsData: [{ nCodigo: idHorario }] 
          });
        });
      },
      (error: any) => {
        console.error('❌ Error al actualizar horario.', error);
      }
    );
  }

  insertar(event: any) {
    const numDias = event.data.nDiasTrabajo || 5; // Por defecto 5 días
    
    const datos = {
      empresaId: this.empresaId,
      nombre: event.data.cNombre,
      descripcion: event.data.cDescripcion || '',
      activo: true,
      detalles: this.generarDiasAutomaticos(numDias)
    };
  
    this.apiService.createHorario(datos).subscribe(
      (response: any) => {
        console.log('✅ Horario insertado correctamente:', response);
        this.traerHorarios();
      },
      (error: any) => {
        console.error('❌ Error al insertar horario.', error);
      }
    );
  }

  eliminar(event: any) {
    const id = event.data.nCodigo;
  
    this.apiService.sincronizarHorario(id).subscribe(
      (response: any) => {
        console.log('✅ Horario eliminado correctamente:', response);
        this.traerHorarios();
        this.detallesEventos = [];
        this.idHorarioActual = null;
      },
      (error: any) => {
        console.error('❌ Error al eliminar registro.', error);
      }
    );
  }

  // Generar días automáticamente según el número indicado
  generarDiasAutomaticos(numDias: number): any[] {
    const detalles = [];
    
    for (let i = 1; i <= numDias; i++) {
      detalles.push({
        id: 0,
        empresaId: this.empresaId,
        horarioCabeceraId: this.idHorarioActual || 0,
        diaSemana: i,
        eventos: [
          {
            id: 0,
            empresaId: this.empresaId,
            horarioDetalleId: 0,
            tipoEvento: 1, // Entrada
            hora: '08:00:00',
            diferenciaDia: 0,
            ventanaMin: 75,
            ventanaMax: 75
          },
          {
            id: 0,
            empresaId: this.empresaId,
            horarioDetalleId: 0,
            tipoEvento: 2, // Salida
            hora: '17:00:00',
            diferenciaDia: 0,
            ventanaMin: 75,
            ventanaMax: 75
          }
        ]
      });
    }
    
    return detalles;
  }

  // Métodos para los eventos individuales

  actualizarDetalleEvento(event: any) {
    if (!this.idHorarioActual) {
      console.error('❌ No hay horario seleccionado');
      return;
    }

    console.log('🔍 EVENT RECIBIDO:', event);
    console.log('🔍 event.key:', event.key);
    console.log('🔍 event.oldData:', event.oldData);
    console.log('🔍 event.newData:', event.newData);
    console.log('🔍 detallesEventos ANTES:', JSON.stringify(this.detallesEventos, null, 2));

    const horario = this.horarios.find(h => h.nCodigo === this.idHorarioActual);
    if (!horario) {
      console.error('❌ No se encontró el horario');
      return;
    }

    // 🔥 ACTUALIZAR el evento en el array antes de reconstruir
    // Intentar con event.key primero, si no existe usar event.oldData.keyUnico
    const keyBuscado = event.key || event.oldData?.keyUnico;
    console.log('🔍 Buscando key:', keyBuscado);
    
    const index = this.detallesEventos.findIndex(e => e.keyUnico === keyBuscado);
    console.log('🔍 Index encontrado:', index);
    
    if (index !== -1) {
      // Fusionar los datos antiguos con los nuevos
      const eventoActualizado = {
        ...this.detallesEventos[index],
        ...event.newData
      };
      
      // Asegurarse de formatear la hora si viene en newData
      if (event.newData.hora !== undefined) {
        eventoActualizado.hora = this.formatearHora(event.newData.hora);
        console.log('🕐 Hora formateada:', eventoActualizado.hora);
      }
      
      // Actualizar nombre del día si cambió
      if (event.newData.diaSemana !== undefined) {
        eventoActualizado.nombreDia = this.obtenerNombreDia(event.newData.diaSemana);
      }
      
      this.detallesEventos[index] = eventoActualizado;
      console.log('✅ Evento actualizado en array:', this.detallesEventos[index]);
    } else {
      console.error('❌ No se encontró el evento con key:', keyBuscado);
    }

    console.log('🔍 detallesEventos DESPUÉS:', JSON.stringify(this.detallesEventos, null, 2));

    // Reconstruir todos los detalles desde el grid de eventos actualizado
    const detallesActualizados = this.reconstruirDetallesDesdeEventos();
    console.log('🔍 DETALLES A ENVIAR:', JSON.stringify(detallesActualizados, null, 2));

    const datos = {
      id: this.idHorarioActual, // 🔥 Agregar el ID en el body
      empresaId: this.empresaId,
      nombre: horario.cNombre,
      descripcion: horario.cDescripcion || '',
      activo: true,
      detalles: detallesActualizados
    };

    console.log('🚀 DATOS COMPLETOS A ENVIAR:', JSON.stringify(datos, null, 2));

    this.apiService.updateHorario(this.idHorarioActual, datos).subscribe(
      (response: any) => {
        console.log('✅ Evento actualizado correctamente:', response);
        this.traerHorarios().then(() => {
          this.mostrarDetalleHorario({ 
            selectedRowsData: [{ nCodigo: this.idHorarioActual }] 
          });
        });
      },
      (error: any) => {
        console.error('❌ Error al actualizar evento.', error);
      }
    );
  }

  insertarDetalleEvento(event: any) {
    if (!this.idHorarioActual) {
      console.error('❌ No hay horario seleccionado');
      return;
    }

    const horario = this.horarios.find(h => h.nCodigo === this.idHorarioActual);
    if (!horario) {
      console.error('❌ No se encontró el horario');
      return;
    }

    // Agregar el nuevo evento a la lista temporal
    this.detallesEventos.push({
      keyUnico: `nuevo-${Date.now()}`,
      detalleId: 0,
      eventoId: 0,
      diaSemana: event.data.diaSemana,
      nombreDia: this.obtenerNombreDia(event.data.diaSemana),
      tipoEvento: event.data.tipoEvento,
      hora: this.formatearHora(event.data.hora),
      diferenciaDia: 0,
      ventanaMin: event.data.ventanaMin || 75,
      ventanaMax: event.data.ventanaMax || 75
    });

    // Reconstruir y enviar
    const detallesActualizados = this.reconstruirDetallesDesdeEventos();

    const datos = {
      empresaId: this.empresaId,
      nombre: horario.cNombre,
      descripcion: horario.cDescripcion || '',
      activo: true,
      detalles: detallesActualizados
    };

    this.apiService.updateHorario(this.idHorarioActual, datos).subscribe(
      (response: any) => {
        console.log('✅ Evento insertado correctamente:', response);
        this.traerHorarios().then(() => {
          this.mostrarDetalleHorario({ 
            selectedRowsData: [{ nCodigo: this.idHorarioActual }] 
          });
        });
      },
      (error: any) => {
        console.error('❌ Error al insertar evento.', error);
      }
    );
  }

  eliminarDetalleEvento(event: any) {
    if (!this.idHorarioActual) {
      console.error('❌ No hay horario seleccionado');
      return;
    }

    const horario = this.horarios.find(h => h.nCodigo === this.idHorarioActual);
    if (!horario) {
      console.error('❌ No se encontró el horario');
      return;
    }

    // Filtrar el evento eliminado
    this.detallesEventos = this.detallesEventos.filter(
      e => e.keyUnico !== event.data.keyUnico
    );

    // Reconstruir y enviar
    const detallesActualizados = this.reconstruirDetallesDesdeEventos();

    const datos = {
      empresaId: this.empresaId,
      nombre: horario.cNombre,
      descripcion: horario.cDescripcion || '',
      activo: true,
      detalles: detallesActualizados
    };

    this.apiService.updateHorario(this.idHorarioActual, datos).subscribe(
      (response: any) => {
        console.log('✅ Evento eliminado correctamente:', response);
        this.traerHorarios().then(() => {
          this.mostrarDetalleHorario({ 
            selectedRowsData: [{ nCodigo: this.idHorarioActual }] 
          });
        });
      },
      (error: any) => {
        console.error('❌ Error al eliminar evento.', error);
      }
    );
  }

  // Reconstruir la estructura de detalles desde los eventos individuales
  reconstruirDetallesDesdeEventos(): any[] {
    // Agrupar eventos por día
    const eventosPorDia = new Map<number, any[]>();
    
    this.detallesEventos.forEach(evento => {
      if (!eventosPorDia.has(evento.diaSemana)) {
        eventosPorDia.set(evento.diaSemana, []);
      }
      eventosPorDia.get(evento.diaSemana)!.push(evento);
    });

    // Convertir a estructura de detalles
    const detalles: any[] = [];
    
    eventosPorDia.forEach((eventos, diaSemana) => {
      // Buscar si ya existe un detalleId para este día
      const detalleId = eventos.find(e => e.detalleId > 0)?.detalleId || 0;
      
      const detalle = {
        id: detalleId,
        empresaId: this.empresaId,
        horarioCabeceraId: this.idHorarioActual!,
        diaSemana: diaSemana,
        eventos: eventos.map(e => ({
          id: e.eventoId || 0,
          empresaId: this.empresaId,
          horarioDetalleId: detalleId,
          tipoEvento: e.tipoEvento,
          hora: this.formatearHora(e.hora),
          diferenciaDia: e.diferenciaDia || 0,
          ventanaMin: e.ventanaMin || 75,
          ventanaMax: e.ventanaMax || 75
        }))
      };
      
      detalles.push(detalle);
    });

    return detalles;
  }

  construirDetallesDesdeHorario(idHorario: number): any[] {
    return this.reconstruirDetallesDesdeEventos();
  }

  formatearHora(hora: any): string {
    if (!hora) return '08:00:00';
    
    if (typeof hora === 'string' && hora.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return hora;
    }
    
    if (hora instanceof Date) {
      const horas = String(hora.getHours()).padStart(2, '0');
      const minutos = String(hora.getMinutes()).padStart(2, '0');
      const segundos = String(hora.getSeconds()).padStart(2, '0');
      return `${horas}:${minutos}:${segundos}`;
    }
    
    if (typeof hora === 'string') {
      return hora.includes(':') ? hora : '08:00:00';
    }
    
    return '08:00:00';
  }

}