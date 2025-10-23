import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-reporte-marcacion',
    templateUrl: './reporte-marcacion.component.html',
    styleUrl: './reporte-marcacion.component.css',
    providers: [DatePipe],
    standalone: false
})
export class ReporteMarcacionComponent {

  marcaciones: any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  now: Date = new Date();
  fechaInicial: any = this.now;
  fechaFinal: any = this.now;

  constructor(
    private apiService: ApiService,
    private datePipe: DatePipe
  ){}

  async ngOnInit(): Promise<void> {
    // Cargar marcaciones al iniciar con la fecha actual
    await this.buscar();
  }

  async traerMarcaciones() {
    this.blockUI.start('Cargando marcaciones...');
  
    try {
      console.log("📅 Trayendo marcaciones desde API...");
      const result = await firstValueFrom(
        this.apiService.getRegistroAsistencia()
      );
  
      console.log("✅ Marcaciones recibidas:", result);

      // Mapeo de datos según la estructura de la API
      this.marcaciones = result.map((r: any) => ({
        id: r.id,
        empresaId: r.empresaId,
        personalId: r.personalId,
        personal: this.obtenerNombreCompleto(r.personal),
        fecha: r.fecha ? new Date(r.fecha) : null,
        fechaJornal: r.fechaJornal ? new Date(r.fechaJornal) : null,
        tipoEvento: this.obtenerTipoEvento(r.tipoEvento),
        esTardanza: r.esTardanza ? "Sí" : "No",
        diferenciaMinutos: r.diferenciaMinutos,
        latitud: r.latitud,
        longitud: r.longitud,
        horarioDetalleEventoId: r.horarioDetalleEventoId,
        registroAsistenciaPoliticaId: r.registroAsistenciaPoliticaId,
        // Datos adicionales
        politica: r.registroAsistenciaPolitica?.nombreCorto || "N/A",
        horaEvento: r.horarioDetalleEvento?.hora || "N/A"
      }));

      console.log("✅ Marcaciones procesadas:", this.marcaciones);
  
    } catch (error) {
      console.error('❌ Error trayendo las marcaciones:', error);
      this.showMessage('Error al cargar las marcaciones');
    } finally {
      this.blockUI.stop();
    }
  }

  obtenerNombreCompleto(personal: any): string {
    if (!personal || !personal.persona) {
      return "Sin información";
    }
    
    // Si tienes nombres y apellidos separados
    const nombres = personal.persona.nombres || "";
    const apellidoPaterno = personal.persona.apellidoPaterno || "";
    const apellidoMaterno = personal.persona.apellidoMaterno || "";
    
    return `${nombres} ${apellidoPaterno} ${apellidoMaterno}`.trim() || "Sin nombre";
  }

  obtenerTipoEvento(tipoEvento: number): string {
    switch(tipoEvento) {
      case 0: return "Entrada";
      case 1: return "Salida";
      case 2: return "Inicio Refrigerio";
      case 3: return "Fin Refrigerio";
      default: return `Tipo ${tipoEvento}`;
    }
  }

  async buscar() {
    // Validar fechas
    if (!this.fechaInicial || !this.fechaFinal) {
      this.showMessage('Selecciona ambas fechas');
      return;
    }

    if (this.fechaInicial > this.fechaFinal) {
      this.showMessage('La fecha inicial no puede ser mayor que la fecha final');
      return;
    }

    await this.traerMarcaciones();
  }

  showMessage(message: string) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
      messageBox.innerText = message;
      messageBox.style.display = 'block';
      setTimeout(() => {
        messageBox.style.display = 'none';
      }, 3000);
    }
  }
}