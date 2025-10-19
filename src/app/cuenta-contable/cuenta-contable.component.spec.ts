import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentaContableComponent } from './cuenta-contable.component';

describe('CuentaContableComponent', () => {
  let component: CuentaContableComponent;
  let fixture: ComponentFixture<CuentaContableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CuentaContableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentaContableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
