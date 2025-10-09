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

  marcaciones : [] = [];
  estados : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  now: Date = new Date();
  fechaInicial: any = this.now;
  fechaFinal: any = this.now;

  constructor(private apiService: ApiService
              , private datePipe: DatePipe
  ){}

  async ngOnInit():Promise<void> {

    //this.traerMarcaciones();

  }

  async traerMarcaciones(fechaInicio: string, fechaFin: string) {
    this.blockUI.start('Cargando...');
  
    try {
      console.log("📅 Trayendo marcaciones desde API...");
      const obser = this.apiService.getRegistroAsistencia(fechaInicio, fechaFin);
      const result = await firstValueFrom(obser);
  
      // Mapeo de datos según tus reglas
      this.marcaciones = result.map((r: any) => ({
        personal: r.personal?.persona?.nombres || "Sin nombre",
        fecha: r.fecha ? new Date(r.fecha) : null,
        fechaJornal: r.fechaJornal ? new Date(r.fechaJornal) : null,
        tipoEvento: r.tipoEvento === 0 ? "Entrada" : "Salida",
        esTardanza: r.esTardanza ? "Sí" : "No",
        diferenciaMinutos: r.diferenciaMinutos
      }));
  
    } catch (error) {
      console.error('❌ Error trayendo las marcaciones:', error);
    } finally {
      this.blockUI.stop();
    }
  }
  

  guardar(event : any){
    console.log(event);
  }

  buscar(){
    let fInicio = this.datePipe.transform(this.fechaInicial, 'yyyy/MM/dd');
    let fFin = this.datePipe.transform(this.fechaFinal, 'yyyy/MM/dd');

    this.traerMarcaciones(fInicio!,fFin!);
  }

  showMessage(message: string) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
      messageBox.innerText = message;
      messageBox.style.display = 'block';
      setTimeout(() => {
        messageBox.style.display = 'none';
      }, 3000); // Ocultar el mensaje después de 3 segundos
    }
  }

}
