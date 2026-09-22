import { TestBed } from '@angular/core/testing';

import { ApiService } from '../../services/api.service';
import { MantoMarcacionesComponent } from './manto-marcaciones.component';

describe('MantoMarcacionesComponent integration', () => {
  it('se crea mediante Angular DI con su propio proveedor de DatePipe', async () => {
    await TestBed.configureTestingModule({
      declarations: [MantoMarcacionesComponent],
      providers: [{ provide: ApiService, useValue: {} }]
    })
      .overrideComponent(MantoMarcacionesComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(MantoMarcacionesComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
