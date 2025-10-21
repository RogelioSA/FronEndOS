import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentotipoComponent } from './documentotipo.component';

describe('DocumentotipoComponent', () => {
  let component: DocumentotipoComponent;
  let fixture: ComponentFixture<DocumentotipoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentotipoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentotipoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
