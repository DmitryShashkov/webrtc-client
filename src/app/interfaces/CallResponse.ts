import {CallRequest} from "./CallRequest";
export interface CallResponse {
    to: CallRequest;
    agreed: boolean;
}
