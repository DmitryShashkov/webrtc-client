import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import {SignallingService} from "./services/signalling";
import { VideoCallComponent } from './video-call/video-call.component';
import { UsersListComponent } from './users-list/users-list.component';
import {RouterModule} from "@angular/router";
import {ConfirmationService} from "./services/confirmation";

@NgModule({
    declarations: [
        AppComponent,
        VideoCallComponent,
        UsersListComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        RouterModule.forRoot([
            { path: '', component: UsersListComponent },
            { path: 'call', component: VideoCallComponent }
        ])
    ],
    providers: [
        SignallingService,
        ConfirmationService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
