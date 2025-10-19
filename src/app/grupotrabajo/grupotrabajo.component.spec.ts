import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrupotrabajoComponent } from './grupotrabajo.component';

describe('GrupotrabajoComponent', () => {
  let component: GrupotrabajoComponent;
  let fixture: ComponentFixture<GrupotrabajoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GrupotrabajoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrupotrabajoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
