import { Component } from '@angular/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

interface Activo{
  nCodigo: number,
  cNombre: string,
  cDetalle: string,
  nClientePropietario: number,
  cTipo: string,
  parametros: any[],
  nCentroCosto: number,
  nProductoLoteId: number,
  nDepreciacionMeses: number,
  cImagenUrl: string,
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

  tipos: { nCodigo: number; cNombre: string }[] = [];
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
      nClientePropietario: 0,
      cTipo: '',
      parametros: [],
      nCentroCosto: 0,
      nProductoLoteId: 0,
      nDepreciacionMeses: 0,
      cImagenUrl: ''
    }

    this.codigoActivo = this.activatedRoute.snapshot.paramMap.get('codActivo');

  }

  async ngOnInit():Promise<void> {

    this.blockUI.start('Cargando...'); // Start blocking

    await this.traerTiposActivo();
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

  async traerActivoEdicion(id: number) {
    console.log('Traer activo');
  
    try {
      const result = await firstValueFrom(this.apiService.getActivoPorCodigo(id));
      const data = result?.data ?? result;
  
      // Mapeo completo con todas las propiedades requeridas
      this.activoServicioPrincipal = {
        nCodigo: data.id ?? 0,
        cNombre: data.nombre ?? '',
        cDetalle: data.descripcion ?? '',
        nClientePropietario: data.terceroId ?? 0,
        nCentroCosto: data.centroDeCostosId ?? 0,
        cTipo: 'actualizar',
        parametros: data.parametros ?? [],
        nProductoLoteId: data.productoLoteId ?? 0,
        nDepreciacionMeses: data.depreciacionMeses ?? 0,
        cImagenUrl: data.imagenUrl ?? ''
      };
  
      // Cargar datos relacionados si existen
      if (data.tercero) {
        console.log('Cliente cargado:', data.tercero.razonSocial);
      }
  
      console.log('Activo obtenido:', this.activoServicioPrincipal);
    } catch (error) {
      console.error('Error trayendo el activo:', error);
    }
  }
  

  async traerTiposActivo() {
    console.log("traer tipos");
  
    try {
      // Intentamos obtener desde la API (por si en el futuro existe)
      const obser = this.apiService.getTiposActivo?.();
      const result = obser ? await firstValueFrom(obser) : null;
  
      // Si no hay API o devuelve vacío, usamos el valor por defecto
      this.tipos = (result && result.data?.length > 0)
        ? result.data
        : [
            {
              nCodigo: 1,
              cNombre: 'Activo'
            }
          ];
  
    } catch (error) {
      console.log('Error trayendo los tipos, usando valor por defecto.', error);
      // En caso de error, también mostramos el valor por defecto
      this.tipos = [
        {
          nCodigo: 1,
          cNombre: 'Activo'
        }
      ];
    }
  }  

  async traerClientes() {
    console.log("traer clientes");
  
    try {
      const obser = this.apiService.getClientes();
      const result = await firstValueFrom(obser);
  
      // Mapeamos los datos al formato que el dx-select-box espera
      this.clientes = result.map((x: any) => ({
        nCodigo: x.id, // 👈 valueExpr
        cRazonSocial: x.razonSocial, // 👈 displayExpr
        cDocumento: x.documentoIdentidadFinanciero,
        cNombreCompleto: x.persona?.nombreCompleto,
        cDireccion: x.direccionFiscal
      }));
  
    } catch (error) {
      console.log('Error trayendo los clientes.', error);
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

  async grabar(){
    this.blockUI.start('Guardando...'); // Start blocking
    
    try {
      const body = {
        productoLoteId: this.activoServicioPrincipal.nProductoLoteId,
        nombre: this.activoServicioPrincipal.cNombre,
        descripcion: this.activoServicioPrincipal.cDetalle,
        depreciacionMeses: this.activoServicioPrincipal.nDepreciacionMeses,
        centroDeCostosId: this.activoServicioPrincipal.nCentroCosto,
        imagenUrl: this.activoServicioPrincipal.cImagenUrl,
        terceroId: this.activoServicioPrincipal.nClientePropietario
      };

      if (this.activoServicioPrincipal.cTipo === 'actualizar') {
        // Modo edición - usar PUT
        await firstValueFrom(
          this.apiService.updateActivo(this.activoServicioPrincipal.nCodigo, body)
        );
        console.log('Activo actualizado correctamente');
      } else {
        // Modo inserción - usar POST
        await firstValueFrom(
          this.apiService.createActivo(body)
        );
        console.log('Activo creado correctamente');
      }
      
      this.router.navigate(['/mantenimiento/ordenServicio/activo']);
      
    } catch (error) {
      console.error('Error al guardar el registro:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
      // this.toastr.error('No se pudo guardar el activo');
    } finally {
      this.blockUI.stop(); // Stop blocking
    }
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