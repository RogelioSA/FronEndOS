import { Component } from '@angular/core';
import { ReporteMarcacionComponent } from '../reporte-marcacion/reporte-marcacion.component';

@Component({
  selector: 'app-manto-marcaciones',
  templateUrl: '../reporte-marcacion/reporte-marcacion.component.html',
  styleUrl: '../reporte-marcacion/reporte-marcacion.component.css',
  standalone: false
})
export class MantoMarcacionesComponent extends ReporteMarcacionComponent {
  protected override readonly restringirMarcacionesOficina: boolean = true;
}
