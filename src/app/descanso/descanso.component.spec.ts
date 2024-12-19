import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescansoComponent } from './descanso.component';

describe('DescansoComponent', () => {
  let component: DescansoComponent;
  let fixture: ComponentFixture<DescansoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DescansoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DescansoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
