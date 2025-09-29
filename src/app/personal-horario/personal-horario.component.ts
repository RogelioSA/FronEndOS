import { Component } from '@angular/core';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-personal-horario',
  templateUrl: './personal-horario.component.html',
  styleUrls: ['./personal-horario.component.css'],
  standalone: false
})
export class PersonalHorarioComponent {
  // Datos
  personalHorarios: any[] = [];         // tabla principal (asignados)
  personalDisponibles: any[] = [];      // lista lateral (disponibles)
  horarios: any[] = [];                 // opciones de horario
  ordenes: any[] = [];                  // órdenes de servicio

  // controles
  ordenCombo: any = null;
  fechaDesde!: Date | null;
  fechaHasta!: Date | null;
  columnasFechas: { field: string; caption: string; date: Date }[] = [];

  // selección y asignación masiva
  seleccionadosMain: any[] = [];
  seleccionDisponibles: any[] = [];
  hayDisponiblesSeleccionados = false;
  horarioParaAsignar: number | null = null;

  desactivarBotonGuardar = true;

  constructor() {
    this.llenarOrdenesPrueba();
    this.llenarHorariosPrueba();
    this.llenarPersonalDisponiblesPrueba(); // lista grande
  }

  /* ================= Datos de prueba ================= */
  llenarOrdenesPrueba() {
    this.ordenes = [
      { nCodigo: 101, cOrdenInterna: 'ORD-101 - Mantenimiento A' },
      { nCodigo: 102, cOrdenInterna: 'ORD-102 - Mantenimiento B' },
      { nCodigo: 103, cOrdenInterna: 'ORD-103 - Mantenimiento C' }
    ];
  }

  llenarHorariosPrueba() {
    this.horarios = [
      { nCodigo: 1, cNombre: 'TC' },
      { nCodigo: 2, cNombre: 'MD' },
      { nCodigo: 3, cNombre: 'TM' },
      { nCodigo: 4, cNombre: 'TN' },
      { nCodigo: 5, cNombre: 'D' }
    ];
  }

  // Lista grande de disponibles (generada)
  llenarPersonalDisponiblesPrueba() {
    const nombres = [
      'Luis Perez','María Gómez','José Huaman','Ana Quispe','Carlos Rojas',
      'Marco Díaz','Lucía Castillo','Pedro Alvarado','Sofía Peña','Andrés Molina',
      'Rosa Vargas','Diego Torres','Natalia Flores','Miguel Herrera','Patricia Ramos',
      'Javier Salinas','Sandra León','Héctor Vásquez','Verónica Paredes','Raúl Mendoza',
      'Gabriela Cruz','Esteban León','Fiorella Ruiz','Óscar Tapia','Juliana Soto',
      'Ricardo Bravo','Mónica Estrada','Samuel Poma','Evelyn Callo','Bruno Arias',
      'Diana Solis','César Izquierdo','Karen Huerta','Fabián Quispe','Olga Medina',
      'Iván Cárdenas','Luz Miranda','Renzo Chacón','Mariela Ortega','Nestor Chumpitaz'
    ];
    this.personalDisponibles = nombres.map((n, idx) => ({ nEmpleado: 300 + idx, cEmpleado: n }));
  }

  /* ================= Construcción de columnas & preload demo ================= */
  onBuscar() {
    if (!this.ordenCombo || !this.fechaDesde || !this.fechaHasta) {
      // no hacemos nada; las tablas muestran el mensaje
      return;
    }
    if (this.fechaDesde > this.fechaHasta) {
      this.showMessage('Fecha Desde no puede ser mayor que Fecha Hasta');
      return;
    }
    this.buildDateColumns(this.fechaDesde, this.fechaHasta);
    this.precargarAsignadosDemo(); // precarga demo con horarios
    this.desactivarBotonGuardar = false;
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

  // Pre-carga datos de demo: toma varios disponibles y les asigna horarios ya puestos
  precargarAsignadosDemo() {
    // número de precargados (puedes cambiar)
    const cant = Math.min(10, this.personalDisponibles.length);
    const precargados = this.personalDisponibles.slice(0, cant);

    // generar filas con horarios alternados
    const assignedRows = precargados.map((p, idx) => {
      const row: any = { nEmpleado: p.nEmpleado, cEmpleado: p.cEmpleado };
      // Ciclar horarios para llenar las columnas
      for (let i = 0; i < this.columnasFechas.length; i++) {
        // ejemplo: patrón: 1,2,3,1,2,3...
        const horarioIdx = (idx + i) % this.horarios.length;
        row[this.columnasFechas[i].field] = this.horarios[horarioIdx].nCodigo;
      }
      return row;
    });

    // Añadir a personalHorarios y remover de personalDisponibles
    this.personalHorarios = [...assignedRows];

    const idsPrecargados = new Set(precargados.map(p => p.nEmpleado));
    this.personalDisponibles = this.personalDisponibles.filter(p => !idsPrecargados.has(p.nEmpleado));
  }

  /* ================= Agregar desde disponibles ================= */
  onDisponiblesSelectionChanged(e: any) {
    this.seleccionDisponibles = e.selectedRowsData || [];
    this.hayDisponiblesSeleccionados = this.seleccionDisponibles.length > 0;
  }

  agregarSeleccionados() {
    if (!this.ordenCombo || !this.fechaDesde || !this.fechaHasta) {
      this.showMessage('Selecciona una orden de servicio y rango de fechas');
      return;
    }
    if (!this.seleccionDisponibles || this.seleccionDisponibles.length === 0) return;

    for (const p of this.seleccionDisponibles) {
      this.addPersonToMain(p);
    }
    // limpiar selección
    this.seleccionDisponibles = [];
    this.hayDisponiblesSeleccionados = false;
  }

  // botón "Asignar" por fila
  agregarUno(person: any) {
    if (!this.ordenCombo || !this.fechaDesde || !this.fechaHasta) {
      this.showMessage('Selecciona una orden de servicio y rango de fechas');
      return;
    }
    if (!person) return;
    this.addPersonToMain(person);
  }

  addPersonToMain(person: any) {
    // evitar duplicados
    if (this.personalHorarios.some(x => x.nEmpleado === person.nEmpleado)) return;

    const row: any = { nEmpleado: person.nEmpleado, cEmpleado: person.cEmpleado };
    for (const c of this.columnasFechas) row[c.field] = null;
    this.personalHorarios = [...this.personalHorarios, row];

    // remover de disponibles
    this.personalDisponibles = this.personalDisponibles.filter(x => x.nEmpleado !== person.nEmpleado);
  }

  /* ================= Edición: autollenado hacia adelante (solo celdas vacías) ================= */
  onRowUpdating(e: any) {
    const rowKey = e.key;
    const newData = e.newData || {};
    const rowIndex = this.personalHorarios.findIndex(r => r.nEmpleado === rowKey);
    if (rowIndex === -1) return;

    const originalRow = { ...this.personalHorarios[rowIndex] };
    const updatedRow = { ...originalRow, ...newData };

    // Para cada campo cambiado, propagar hacia adelante (solo en celdas vacías)
    const changedFields = Object.keys(newData);
    for (const field of changedFields) {
      const colIndex = this.columnasFechas.findIndex(c => c.field === field);
      if (colIndex === -1) continue;
      const nuevoValor = newData[field];

      if (nuevoValor !== null && nuevoValor !== undefined) {
        // Propagar hacia adelante para celdas vacías
        for (let i = colIndex + 1; i < this.columnasFechas.length; i++) {
          const f = this.columnasFechas[i].field;
          if (updatedRow[f] === null || updatedRow[f] === undefined) {
            updatedRow[f] = nuevoValor;
          } else {
            // si ya hay valor, no sobreescribimos, pero seguimos buscando (según tu regla)
            // si prefieres detener propagation al encontrar un valor, descomenta el siguiente break:
            // break;
          }
        }
      }
    }

    // reemplazar fila en el array
    const copy = [...this.personalHorarios];
    copy[rowIndex] = updatedRow;
    this.personalHorarios = copy;
  }

  /* ================= Selección principal y asignación masiva ================= */
  onMainGridSelectionChanged(e: any) {
    this.seleccionadosMain = e.selectedRowsData || [];
  }

  asignarHorarioASeleccionados() {
    if (!this.horarioParaAsignar) return;
    if (!this.seleccionadosMain || this.seleccionadosMain.length === 0) return;

    const updated = this.personalHorarios.map(row => {
      if (this.seleccionadosMain.some((s: any) => s.nEmpleado === row.nEmpleado)) {
        const copyRow = { ...row };
        for (const c of this.columnasFechas) {
          // asigna solo si está vacío (si quieres sobrescribir, quita la condición)
          copyRow[c.field] = this.horarioParaAsignar;
        }
        return copyRow;
      }
      return row;
    });

    this.personalHorarios = updated;
  }

  /* ================= Desasignar ================= */
  desasignarSeleccionados() {
    if (!this.seleccionadosMain || this.seleccionadosMain.length === 0) return;

    const desasignados = this.seleccionadosMain.map((p: any) => ({ nEmpleado: p.nEmpleado, cEmpleado: p.cEmpleado }));
    // Añadir de vuelta a disponibles si no existen
    desasignados.forEach(p => {
      if (!this.personalDisponibles.some(d => d.nEmpleado === p.nEmpleado)) {
        this.personalDisponibles = [...this.personalDisponibles, p];
      }
    });

    // Quitar de la tabla principal
    const ids = new Set(desasignados.map(p => p.nEmpleado));
    this.personalHorarios = this.personalHorarios.filter(p => !ids.has(p.nEmpleado));
    this.seleccionadosMain = [];
  }

  /* ================= Guardar ================= */
  enviarPersonalHorario() {
    if (!this.ordenCombo || !this.fechaDesde || !this.fechaHasta) {
      this.showMessage('Selecciona una orden de servicio y rango de fechas');
      return;
    }

    const lista = this.personalHorarios.filter((p) =>
      this.columnasFechas.some(c => p[c.field] !== null && p[c.field] !== undefined)
    );

    console.log('Guardando payload demo ->', {
      orden: this.ordenCombo,
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta,
      lista
    });

    this.showMessage('Personal asignado correctamente');
  }

  /* ================= Utilidades ================= */
  showMessage(message: string) {
    // simple mensaje visual (small box); también puedes reemplazar por toast
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
