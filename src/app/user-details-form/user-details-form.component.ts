import { Component, OnInit } from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {SignallingService} from "../services/signalling";
import {User} from "../interfaces/User";
import {MESSAGES} from "../constants";

@Component({
    selector: 'user-details-form',
    templateUrl: './user-details-form.component.html',
    styleUrls: ['./user-details-form.component.css']
})
export class UserDetailsFormComponent implements OnInit {
    private userDetailsForm: FormGroup;

    constructor (
        private fb: FormBuilder,
        private signallingService: SignallingService
    ) {
        this.userDetailsForm = fb.group({
            name: [ '', [
                Validators.required
            ]]
        });
    }

    ngOnInit () {}

    private hasErrors (controlName: string, errorName: string) : boolean {
        let targetControl: AbstractControl = this.userDetailsForm.controls[controlName];
        return targetControl
            && targetControl.touched
            && targetControl.errors
            && targetControl.errors[errorName];
    }

    private submitNewDetails () {
        if (this.userDetailsForm.valid) {
            let newUser: User = {
                id: this.signallingService.currentUser.id,
                name: this.userDetailsForm.controls['name'].value
            };

            this.signallingService.currentUser = newUser;

            this.signallingService.send<User> (
                MESSAGES.DETAILS_CHANGE_REQUESTED,
                newUser
            );
        }
    }

}
