import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { Http } from '@angular/http';

declare let CodeMirror: any;

@Component({
    selector: 'api-manager',
    templateUrl: '/app/api-manager/api-manager.html',
})
export class ApiManagerComponent implements OnInit {
    ngOnInit(): void {
    }

}
