import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { MarcacionespecificaComponent } from './marcacionespecifica.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

describe('MarcacionespecificaComponent', () => {
  let component: MarcacionespecificaComponent;
  let fixture: ComponentFixture<MarcacionespecificaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MarcacionespecificaComponent],
      imports: [FormsModule],
      providers: [
        {
          provide: ApiService,
          useValue: {
            listarOrdenTrabajoCabeceraSimplificado: () => of([]),
            subirAdjunto: () => of({ id: 10 }),
            registrarMarcacionEspecifica: () => of({ id: 20 })
          }
        },
        { provide: AuthService, useValue: { getClaims: () => ({ nCodigo: 1 }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarcacionespecificaComponent);
    component = fixture.componentInstance;
  });

  it('should map entry and exit buttons to event types 0 and 1', () => {
    const spy = spyOn(component, 'marcarAsistencia');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.mark-button');
    buttons[0].click();
    buttons[1].click();
    expect(spy.calls.allArgs()).toEqual([[0], [1]]);
  });

  it('should only load active work orders whose names start with EM or CAPA', async () => {
    const apiService = TestBed.inject(ApiService) as any;
    spyOn(apiService, 'listarOrdenTrabajoCabeceraSimplificado').and.returnValue(of([
      { id: 101, nombre: 'EM-Examen médico', descripcion: 'Trabajo activo', estado: 1 },
      { id: 102, nombre: 'CAPA-Seguridad', descripcion: 'Trabajo activo', estado: 1 },
      { id: 103, nombre: 'EM-Inactivo', descripcion: 'Trabajo cerrado', estado: 0 },
      { id: 27, nombre: 'OT anterior', descripcion: 'Trabajo activo', estado: 1 }
    ]));

    await component.cargarOrdenesTrabajo();

    expect(component.ordenesTrabajo.map(orden => orden.id)).toEqual([101, 102]);
  });

  it('should require an observation before marking attendance', async () => {
    component.ordenTrabajoId = 1;
    component.observacion = '   ';

    await component.marcarAsistencia(0);

    expect(component.esError).toBeTrue();
    expect(component.mensaje).toBe('Ingrese una observación antes de marcar.');
  });

  it('should send tipoRegularizacion with default value 1', async () => {
    const apiService = TestBed.inject(ApiService) as any;
    const registrarSpy = spyOn(apiService, 'registrarMarcacionEspecifica').and.returnValue(of({ id: 20 }));
    spyOn<any>(component, 'capturePhoto').and.returnValue('data:image/jpeg;base64,AA==');
    component.ordenTrabajoId = 1;
    component.observacion = 'Trabajo realizado';
    component.coordinates = '-12.0000000, -77.0000000';
    component.latitude = -12;
    component.longitude = -77;

    await component.marcarAsistencia(0);

    expect(registrarSpy).toHaveBeenCalledWith(jasmine.objectContaining({
      tipoRegularizacion: 1
    }));
  });
});
