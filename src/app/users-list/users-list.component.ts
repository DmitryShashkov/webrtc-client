import { SubscriptionsList } from '../interfaces/SubscriptionsList';
import { ConfirmationService } from '../services/confirmation';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SignallingService } from '../services/signalling';
import { CallResponse } from '../interfaces/CallResponse';
import { CallRequest } from '../interfaces/CallRequest';
import { MESSAGES, ROLES } from '../constants';
import { User } from '../interfaces/User';
import { Router } from '@angular/router';

@Component({
    selector: 'users-list',
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit, OnDestroy {
    private subscriptions: SubscriptionsList = {};

    private users: User[] = [];

    private callID: number;

    constructor (
        private signallingService: SignallingService,
        private confirmation: ConfirmationService,
        private router: Router
    ) { }

    ngOnInit () {
        this.listenToUsersChanges();
        this.listenToCallRequests();
        this.listenToCallResponses();
    }

    private listenToUsersChanges () : void {
        this.subscriptions[MESSAGES.USERS_LIST_CHANGED] =
            this.signallingService
                .on(MESSAGES.USERS_LIST_CHANGED)
                .subscribe((users: User[]) => {
                    this.users = users.filter (
                        (user) => user.id !== this.signallingService.currentUser.id
                    );
                });
    }

    private listenToCallRequests () : void {
        let receivedRequest: CallRequest;

        this.subscriptions[MESSAGES.CALL.REQUESTED] =
            this.signallingService
                .on(MESSAGES.CALL.REQUESTED)
                .flatMap((request: CallRequest) => {
                    receivedRequest = request;
                    return this.confirmation
                        .ask(`${request.caller.name || 'Nameless user'} is calling. Answer him?`);
                })
                .subscribe((shouldAnswer: boolean) => {
                    this.signallingService.send<CallResponse> (
                        MESSAGES.CALL.RESOLVED,
                        {
                            to: receivedRequest,
                            agreed: shouldAnswer
                        }
                    );

                    if (shouldAnswer) {
                        this.router.navigate(['call'], {
                            queryParams: {
                                companion: receivedRequest.caller.id,
                                role: ROLES.CALLEE
                            }
                        })
                    }
                });
    }

    private listenToCallResponses () : void {
        this.subscriptions[MESSAGES.CALL.RESOLVED] =
            this.signallingService
                .on(MESSAGES.CALL.RESOLVED)
                .subscribe((response: CallResponse) => {
                    if (response.to.callID === this.callID && response.agreed) {
                        this.router.navigate(['call'], {
                            queryParams: {
                                companion: response.to.callee.id,
                                role: ROLES.CALLER
                            }
                        })
                    }
                });
    }

    private call (user: User) {
        this.callID = +(new Date());

        this.signallingService
            .send<CallRequest> (
                MESSAGES.CALL.REQUESTED,
                {
                    callID: this.callID,
                    caller: this.signallingService.currentUser,
                    callee: user
                }
            );
    }

    ngOnDestroy () {
        for (let key in this.subscriptions) {
            this.subscriptions[key].unsubscribe();
        }
    }
}
