import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { MantoMarcacionesComponent } from './manto-marcaciones.component';

describe('MantoMarcacionesComponent integration', () => {
  it('se crea mediante Angular DI con su propio proveedor de DatePipe', async () => {
    await TestBed.configureTestingModule({
      declarations: [MantoMarcacionesComponent],
      providers: [{ provide: ApiService, useValue: {} }]
    })
      .overrideComponent(MantoMarcacionesComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(MantoMarcacionesComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza grupos de marcaciones y asignaciones con el trackBy compartido', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [MantoMarcacionesComponent],
      providers: [{ provide: ApiService, useValue: { listarOrdenTrabajoCabeceraSimplificado: () => of([]) } }]
    })
      .overrideComponent(MantoMarcacionesComponent, { set: {
        template: '<div *ngFor="let grupo of datosAgrupados; trackBy: trackByGrupo">{{ grupo.orden }}</div>'
      } })
      .compileComponents();

    const fixture = TestBed.createComponent(MantoMarcacionesComponent);
    const component = fixture.componentInstance;
    const empleado = { orden: 'OT 53', dni: '12345678', personal: 'Ana', personalId: 15, marcaciones: {} };
    component.datosReporte = [empleado, { ...empleado, ordenAsignacionId: 53 }];
    component.agruparDatosPorOrden();

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelectorAll('div').length).toBe(2);
  });
});
