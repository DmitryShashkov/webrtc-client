import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import {SignallingService} from "./services/signalling";
import { VideoCallComponent } from './video-call/video-call.component';
import { UsersListComponent } from './users-list/users-list.component';
import {RouterModule} from "@angular/router";
import {ConfirmationService} from "./services/confirmation";
import { UserDetailsFormComponent } from './user-details-form/user-details-form.component';

@NgModule({
    declarations: [
        AppComponent,
        VideoCallComponent,
        UsersListComponent,
        UserDetailsFormComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
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
