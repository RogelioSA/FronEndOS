import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { DxButtonModule, DxDateBoxModule } from 'devextreme-angular';
import { ApiService } from '../../services/api.service';
import { RepmarcacionServicioComponent } from './repmarcacion-servicio.component';

describe('RepmarcacionServicioComponent', () => {
  let fixture: ComponentFixture<RepmarcacionServicioComponent>;
  let component: RepmarcacionServicioComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [RepmarcacionServicioComponent], imports: [FormsModule, DxButtonModule, DxDateBoxModule], providers: [{ provide: ApiService, useValue: { getRegistroAsistencia: () => of([]), getPersonalDetalle: () => of([]), getCargos: () => of([]) } }] }).compileComponents();
    fixture = TestBed.createComponent(RepmarcacionServicioComponent); component = fixture.componentInstance;
  });
  it('incluye sólo registros con OT y calcula HH descontando descanso', () => {
    component.fechaInicial = component.fechaFinal = new Date(2026, 8, 8); (component as any).generarColumnasFechas();
    const base = { personalId: 1, persona: { id: 1, nombreCompleto: 'Pérez, Ana', documentoIdentidad: '123' }, personalCargoExterno: { cargoId: 2 }, fechaJornal: '2026-09-08' };
    (component as any).procesarDatos([
      { ...base, ordenTrabajo: { id: null }, fecha: '2026-09-08T07:00:00', tipoEvento: 0 },
      { ...base, ordenTrabajo: { id: 10, nombre: 'OS-10' }, fecha: '2026-09-08T08:00:00', tipoEvento: 0, minutosDescanso: 60 },
      { ...base, ordenTrabajo: { id: 10, nombre: 'OS-10' }, fecha: '2026-09-08T18:00:00', tipoEvento: 1 }
    ], [{ persona: base.persona, personalCargoExterno: { cargoId: 2 } }], [{ id: 2, nombre: 'TÉCNICO' }]);
    expect(component.empleados.length).toBe(1); expect(component.empleados[0].totalHoras).toBe(9);
    expect(component.empleados[0].dias['2026-09-08'].detalles[0].ordenServicio).toBe('OS-10');
  });
  it('marca con -1 una marcación incompleta sin sumarla al total', () => {
    component.fechaInicial = component.fechaFinal = new Date(2026, 8, 8); (component as any).generarColumnasFechas();
    (component as any).procesarDatos([{ personalId: 1, persona: { id: 1 }, ordenTrabajo: { id: 5, nombre: 'OS' }, fechaJornal: '2026-09-08', fecha: '2026-09-08T08:00:00', tipoEvento: 0 }], [], []);
    expect(component.horasDetalle(component.empleados[0].dias['2026-09-08'])).toBe('-1'); expect(component.empleados[0].totalHoras).toBe(0);
  });
});
