import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantenimientotipoComponent } from './mantenimientotipo.component';

describe('MantenimientotipoComponent', () => {
  let component: MantenimientotipoComponent;
  let fixture: ComponentFixture<MantenimientotipoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MantenimientotipoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MantenimientotipoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
