import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent }  from './app.component';
import { BodyMappingParserComponent }  from './body-mapping-parser/body-mapping-parser.component';
import { ApiManagerComponent }  from './api-manager/api-manager.component';
import {HttpModule} from "@angular/http";

@NgModule({
    imports:      [ BrowserModule, HttpModule ],
    declarations: [ AppComponent, BodyMappingParserComponent, ApiManagerComponent ],
    bootstrap:    [ AppComponent ]
})
export class AppModule { }
