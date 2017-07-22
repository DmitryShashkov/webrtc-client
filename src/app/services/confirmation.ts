import {Injectable} from "@angular/core";
import {Observable} from "rxjs";

@Injectable()
export class ConfirmationService {
    constructor () {}

    public ask (state: string) : Observable<boolean> {
        return Observable.of( confirm(state) );
    }
}
