import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentoidentidadtipoComponent } from './documentoidentidadtipo.component';

describe('DocumentoidentidadtipoComponent', () => {
  let component: DocumentoidentidadtipoComponent;
  let fixture: ComponentFixture<DocumentoidentidadtipoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentoidentidadtipoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentoidentidadtipoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
