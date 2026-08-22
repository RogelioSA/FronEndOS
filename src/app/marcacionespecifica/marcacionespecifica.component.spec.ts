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
        { provide: ApiService, useValue: { listarOrdenTrabajoCabeceraSimplificado: () => of([]) } },
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
});
