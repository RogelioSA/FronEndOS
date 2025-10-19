import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManttoOrdenservicioComponent } from './mantto-ordenservicio.component';

describe('ManttoOrdenservicioComponent', () => {
  let component: ManttoOrdenservicioComponent;
  let fixture: ComponentFixture<ManttoOrdenservicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManttoOrdenservicioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManttoOrdenservicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
