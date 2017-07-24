import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { User } from 'app/interfaces/User';
import { MESSAGES } from '../constants';
import Format from '../formatter';
import * as SocketIO from 'socket.io-client';

@Injectable()
export class SignallingService {
    private socket: SocketIO.Socket = SocketIO(environment.signalEndpoint);

    private subjects: { [id: string]: Subject<any> } = {};

    constructor () {
        Format.toFlatList(MESSAGES).forEach((message: string) => {
            this.subjects[message] = new Subject<any>();
            this.socket.on(message, (data: any) => {
                this.subjects[message].next(data);
            });
        });
    }

    public send<T> (messageType: string, payload: T) : void {
        this.socket.send(messageType, payload);
    }

    public on (messageType: string) : Observable<any> {
        return this.subjects[messageType].asObservable();
    }

    public get currentUser () : User {
        return {
            id: this.socket.id,
            name: this.socket['name']
        };
    }

    public set currentUser (user: User) {
        this.socket['name'] = user.name;
    }
}
