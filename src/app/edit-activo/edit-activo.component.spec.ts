import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditActivoComponent } from './edit-activo.component';

describe('EditActivoComponent', () => {
  let component: EditActivoComponent;
  let fixture: ComponentFixture<EditActivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditActivoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditActivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
