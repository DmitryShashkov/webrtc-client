import { environment } from '../../environments/environment';

export default class Logger {
    public static log (message: any) {
        if (environment.verbose) {
            console.log(message);
        }
    }
}
