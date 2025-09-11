import { Component } from '@angular/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

interface Activo{
  nCodigo: number,
  cNombre: string,
  cDetalle: string,
  cNumeroSerie: string,
  cColor: string,
  nAnioFabricacion: number,
  nTipoActivoServicio: number,
  nMarca: number,
  nModelo: number,
  nClientePropietario: number,
  cTipo: string,
  parametros: any[]
}

@Component({
    selector: 'app-edit-activo',
    templateUrl: './edit-activo.component.html',
    styleUrl: './edit-activo.component.css',
    standalone: false
})
export class EditActivoComponent {

  activo: any;
  nameEditorOptions: any;
  nameEditorOptions2: any;
  codigoActivo!: any;
  activoServicioPrincipal!: Activo;
  tipoActivoSeleccionado: any;
  @BlockUI() blockUI!: NgBlockUI;

  selectedIndex = 0;

  tipoGrabado: string = '';
  textoBoton: string = '';
  iconoBoton: string = '';
  fondoBoton: string = '';
  tipoBoton: string = '';

  tipos: [] = [];
  marcas: [] = [];
  modelos: [] = [];
  clientes: [] = [];
  parametros: any[] = [];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ){
    this.nameEditorOptions = { disabled: true, labelMode: "floating" };
    this.nameEditorOptions2 = { labelMode: "floating", stylingMode: 'underline' };

    this.activoServicioPrincipal = {
      nCodigo: 0,
      cNombre: '',
      cDetalle: '',
      cNumeroSerie: '',
      cColor: '',
      nAnioFabricacion: 0,
      nTipoActivoServicio: 0,
      nMarca: 0,
      nModelo: 0,
      nClientePropietario: 0,
      cTipo: '',
      parametros: []
    }

    this.codigoActivo = this.activatedRoute.snapshot.paramMap.get('codActivo');

  }

  async ngOnInit():Promise<void> {

    this.blockUI.start('Cargando...'); // Start blocking

    await this.traerTiposActivo();
    await this.traerMarcasActivo();
    await this.traerClientes();

    if(this.codigoActivo === null){
      //ConfiguracionBoton
      this.tipoGrabado = 'insertar';
      this.textoBoton = 'Guardar';
      this.iconoBoton = 'fa-solid fa-floppy-disk';
      this.fondoBoton = '#8bc34a';
      this.tipoBoton = 'default';

      this.activoServicioPrincipal.cTipo = 'insertar';
    }else{
      //ConfiguracionBoton
      this.tipoGrabado = 'actualizar';
      this.textoBoton = 'Modificar';
      this.iconoBoton = 'fa-solid fa-pen';
      this.fondoBoton = '#FFEB3B';
      this.tipoBoton = 'normal';

      await this.traerActivoEdicion(this.codigoActivo);
      this.activoServicioPrincipal.cTipo = 'actualizar';
    }

    this.blockUI.stop();

  }

  async traerActivoEdicion(codigo: number){
    console.log("traer activo");

    try{
      const obser = this.apiService.getActivoPorCodigo(codigo);
      const result = await firstValueFrom(obser);

      if(result.data !== null){
        this.activoServicioPrincipal = result.data;
        console.log(this.activoServicioPrincipal)
      }else{

      }
    }catch(error){
      console.log('Error traendo el activo.')
    }finally{
    }
  }

  async traerTiposActivo(){
    console.log("traer tipos");

    try{
      const obser = this.apiService.getTiposActivo();
      const result = await firstValueFrom(obser);

      this.tipos = result.data;
    }catch(error){
      console.log('Error traendo los tipos.')
    }finally{
    }
  }

  async traerMarcasActivo(){
    console.log("traer marcas");

    try{
      const obser = this.apiService.getMarcasActivo();
      const result = await firstValueFrom(obser);

      this.marcas = result.data;
    }catch(error){
      console.log('Error traendo las marcas.')
    }finally{
    }
  }

  async traerModelosActivo(tipoActivo: number){
    console.log("traer modelos");

    try{
      const obser = this.apiService.getModelosActivo(tipoActivo);
      const result = await firstValueFrom(obser);

      this.modelos = result.data;
    }catch(error){
      console.log('Error traendo los modelos.')
    }finally{
    }
  }

  async traerClientes(){
    console.log("traer clientes");

    try{
      const obser = this.apiService.getClientes();
      const result = await firstValueFrom(obser);

      this.clientes = result.data;
    }catch(error){
      console.log('Error traendo los clientes.')
    }finally{
    }
  }

  async traerParametrosActivo(tipoActivo: number){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer parametros");

    try{
      const obser = this.apiService.getParametrosActivo(tipoActivo);
      const result = await firstValueFrom(obser);

      this.parametros = result.data;

      const listaCombinada = this.parametros.map(item1 => {
          const item2 = (this.activoServicioPrincipal.parametros).find(item => item.nParametro === item1.nCodigo);
          return item2 ? { ...item1, ...item2 } : item1;  // Combina los dos objetos
      });

      this.parametros = listaCombinada;

    }catch(error){
      console.log('Error traendo los parametros.')
    }finally{
      this.blockUI.stop();
    }
  }

  async cambioMarca(event: any){
    await this.traerModelosActivo(event.value);
  }

  async grabar(){

    await this.apiService.sincronizarActivo(this.activoServicioPrincipal).subscribe(
      (response: any) => {
        this.router.navigate(['/mantenimiento/ordenServicio/activo']);
      },
      (error: any) => {
        console.error('Error al insertar registro.', error);
      }
    );
  }

  onFormSubmit(event: any){

    console.log(this.activoServicioPrincipal);
    let lista = [];

    for(var a = 0; a < this.parametros.length; a++){
      if(this.parametros[a].cValor !== undefined){
        lista.push(
          {
            nCodigoActivoParametro: this.parametros[a].nCodigoActivoParametro,
            cValor: this.parametros[a].cValor,
            nParametro: this.parametros[a].nCodigo
          }
        );
      }
    }

    this.activoServicioPrincipal.parametros = lista;

    console.log('lista',lista);

    this.grabar();
  }

  cancelar(){
    this.router.navigate(['/mantenimiento/ordenServicio/activo']);
  }

  async cambiandoTipo(event: any){

    await this.traerParametrosActivo(this.tipoActivoSeleccionado.nCodigo);

    console.log(this.parametros);
  }
}
