import {Injectable} from "@angular/core";
import * as SocketIO from 'socket.io-client';
import {Observable, Subject} from "rxjs";
import {MESSAGES} from "../constants";
import {User} from "app/interfaces/User";

@Injectable()
export class SignallingService {
    private socket: SocketIO.Socket = SocketIO('localhost:7055');

    private subjects: { [id: string]: Subject<any> } = {};

    constructor () {
        console.log(this.socket);

        this.subjects[ MESSAGES.USERS_LIST_CHANGED ] = new Subject<any>();
        this.subjects[ MESSAGES.CALL.REQUESTED ] = new Subject<any>();
        this.subjects[ MESSAGES.CALL.RESOLVED ] = new Subject<any>();
        this.subjects[ MESSAGES.NEW_ICE_CANDIDATE ] = new Subject<any>();
        this.subjects[ MESSAGES.NEW_DESCRIPTION ] = new Subject<any>();
        this.subjects[ MESSAGES.CALLEE_ARRIVED ] = new Subject<any>();

        this.socket.on(MESSAGES.USERS_LIST_CHANGED, (data) => {
            this.subjects[MESSAGES.USERS_LIST_CHANGED].next(data);
        });
        this.socket.on(MESSAGES.CALL.REQUESTED, (data) => {
            this.subjects[MESSAGES.CALL.REQUESTED].next(data);
        });
        this.socket.on(MESSAGES.CALL.RESOLVED, (data) => {
            this.subjects[MESSAGES.CALL.RESOLVED].next(data);
        });
        this.socket.on(MESSAGES.NEW_ICE_CANDIDATE, (data) => {
            this.subjects[MESSAGES.NEW_ICE_CANDIDATE].next(data);
        });
        this.socket.on(MESSAGES.NEW_DESCRIPTION, (data) => {
            this.subjects[MESSAGES.NEW_DESCRIPTION].next(data);
        });
        this.socket.on(MESSAGES.CALLEE_ARRIVED, (data) => {
            this.subjects[MESSAGES.CALLEE_ARRIVED].next(data);
        });
        // this.subjects[MESSAGES.USERS_LIST_CHANGED].next.bind(this)
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
}
