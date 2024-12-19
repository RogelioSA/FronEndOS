import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteMarcacionComponent } from './reporte-marcacion.component';

describe('ReporteMarcacionComponent', () => {
  let component: ReporteMarcacionComponent;
  let fixture: ComponentFixture<ReporteMarcacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteMarcacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReporteMarcacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
