import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CondicionContractualComponent } from './condicion-contractual.component';

describe('CondicionContractualComponent', () => {
  let component: CondicionContractualComponent;
  let fixture: ComponentFixture<CondicionContractualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CondicionContractualComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CondicionContractualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
