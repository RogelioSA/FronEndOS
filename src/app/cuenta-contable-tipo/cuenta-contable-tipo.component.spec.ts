import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentaContableTipoComponent } from './cuenta-contable-tipo.component';

describe('CuentaContableTipoComponent', () => {
  let component: CuentaContableTipoComponent;
  let fixture: ComponentFixture<CuentaContableTipoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CuentaContableTipoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentaContableTipoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
