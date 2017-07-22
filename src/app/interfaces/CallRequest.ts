import {User} from "./User";
export interface CallRequest {
    callID: number;
    caller: User;
    callee: User;
}
