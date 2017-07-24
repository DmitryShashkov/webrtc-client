import * as _ from 'lodash';

export default class Format {
    public static toFlatList (object: any) : string[] {
        let results: string[] = [];

        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                let value: any = object[key];

                if (_.isString(value)) {
                    results.push(value);
                }

                if (_.isObject(value)) {
                    results = results.concat(Format.toFlatList(value));
                }
            }
        }

        return results;
    }
}
