import { AuthService } from './../services/auth.service';
import { Component, HostListener } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.css'
})
export class MenuBarComponent {

  menus : any[] = [];
  menuBar : any[] = [];
  hijos : any[] = [];
  menu2 : any[] = [];
  @BlockUI() blockUI!: NgBlockUI;

  menuOpen = false;
  isMobile = false;
  claims: any;

  constructor(private router: Router
              ,private apiService: ApiService
              , private authService : AuthService
  ){
    this.checkIfMobile();
  }

  async ngOnInit():Promise<void> {

    this.claims = this.authService.getClaims();

    await this.traerMenus();

    this.armarArregloMenuBar();

  }

  async traerMenus(){
    this.blockUI.start('Cargando...'); // Start blocking

    console.log("traer menus");

    try{
      const obser = this.apiService.getMenus();
      const result = await firstValueFrom(obser);

      this.menus = result.data;

      let usuario = {
                            text: this.claims.cUsuario,
                            cNombre: this.claims.cUsuario,
                            nCodigo: 990,
                            cPath: '#',
                            nPadre: 0,
                            nOrden: 999,
                            cssClass: 'logout-item',  // Añadimos una clase personalizada para el botón de logout
                          };
      
      let cerrarSesion = {
                                cNombre: 'Cerrar Sesión',
                                nCodigo: 999,
                                nPadre: 990
      }
      this.menus.push(usuario);
      this.menus.push(cerrarSesion);
    }catch(error){
      console.log('Error traendo los menus.')
    }finally{
      this.blockUI.stop();
    }
  }

  onLogout(){
    this.authService.logout();
  }

  // Detectar si el tamaño de la pantalla es móvil
  @HostListener('window:resize', ['$event'])
  onResize(event:any) {
    this.checkIfMobile();
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  onMenuItemClick(event: any) {
    console.log(event);

    if(event.itemData.nCodigo === 999){
      this.onLogout();
      window.location.reload();
    }else{
      const path = event.itemData.path;
      if(path !== '#')
        this.router.navigate([path]);
      else{
        
      }
    }
  }

  armarArregloMenuBar(){

    for(var a = 0; a < this.menus.length; a++){

      this.menus[a].items = [];
      this.menus[a].migrado = false;
      this.menus[a].path = this.menus[a].cPath;

      if(this.menus[a].nPadre === 0){
        //this.menuBar.push(this.menus[a]);
        this.menuBar[this.menus[a].nOrden] = this.menus[a];
        this.menus[a].migrado = true;

        this.menu2[this.menus[a].nOrden] = this.menus[a];
      }else{
        this.hijos.push(this.menus[a]);
      }
    }

    //filtro para limpiar todos los elementos que quedan vacios por el nOrden
    this.menuBar = this.menuBar.filter((m) => m !== undefined);

    for(var b = 0; b < this.hijos.length; b++){
      for(var c = 0; c < this.hijos.length; c++){

        if(b !== c){
          if(this.hijos[b].nPadre === this.hijos[c].nCodigo){
            this.hijos[c].items.push(this.hijos[b]);
          }
        }

      }
    }

    for(var d = 0; d < this.menuBar.length; d++){
      for(var e = 0; e < this.hijos.length; e++){
        if(this.menuBar[d].nCodigo === this.hijos[e].nPadre){
          this.menuBar[d].items.push(this.hijos[e]);
        }
      }
    }

    // console.log(this.menus);
    // console.log(this.menuBar);
    // console.log(this.hijos);


    // for(var a = 0; a < this.menus.length; a++){

    //   this.menus[a].items = [];
    //   this.menus[a].migrado = false;
    //   this.menus[a].path = this.menus[a].cPath;

    //   if(this.menus[a].nPadre === 0){
    //     this.menuBar.push(this.menus[a]);
    //     this.menus[a].migrado = true;
    //   }else{
    //     this.hijos.push(this.menus[a]);
    //   }
    // }

    // for(var b = 0; b < this.hijos.length; b++){
    //   for(var c = 0; c < this.menuBar.length; c++){
    //     if(this.hijos[b].nPadre === this.menuBar[c].nCodigo){
    //       this.menuBar[c].items.push(this.hijos[b]);
    //       this.hijos[b].migrado = true;
    //     }
    //   }
    // }
  }

  // myFunction() {
  //   var x = document.getElementById("myTopnav");

  //   if(x){
  //     if (x.className === "topnav") {
  //       x.className += " responsive";
  //     } else {
  //       x.className = "topnav";
  //     }
  //   }
  // }

}
