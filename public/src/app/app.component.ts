import {Component, ViewChild, OnInit, ElementRef} from '@angular/core';
import {Http} from "@angular/http";

declare let CodeMirror:any;

@Component({
    selector: 'ags-app',
    templateUrl: '/app/app.component.html',
})
export class AppComponent implements  OnInit {
    private menus = [
        //{id:1, name:"Api Manager", active:false, error:false},
        {id:2, name:"Body Mapping Parser", active:false, error:false}
    ];

    activeMenuId:number;

    private onChangeMenu(menu:any) {
        this.activeMenuId = menu.id;
    }

    ngOnInit(): void {
        this.activeMenuId = this.menus[0].id;
    }

}
