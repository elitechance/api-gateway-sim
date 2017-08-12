"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var AppComponent = (function () {
    function AppComponent() {
        this.menus = [
            // {id:1, name:"Api Manager", active:false, error:false},
            { id: 2, name: 'Body Mapping Parser', active: false, error: false }
        ];
    }
    AppComponent.prototype.ngOnInit = function () {
        this.activeMenuId = this.menus[0].id;
    };
    AppComponent.prototype.onChangeMenu = function (menu) {
        this.activeMenuId = menu.id;
    };
    AppComponent = __decorate([
        core_1.Component({
            selector: 'ags-app',
            templateUrl: '/app/app.component.html',
        })
    ], AppComponent);
    return AppComponent;
}());
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map