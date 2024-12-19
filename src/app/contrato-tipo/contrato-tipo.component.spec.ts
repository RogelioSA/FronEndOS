import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratoTipoComponent } from './contrato-tipo.component';

describe('ContratoTipoComponent', () => {
  let component: ContratoTipoComponent;
  let fixture: ComponentFixture<ContratoTipoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContratoTipoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContratoTipoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
