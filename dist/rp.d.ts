export interface RequestPromiseOptions {
    uri: string;
    qs: {
        [name: string]: string | number | boolean;
    };
}
declare const rp: (options: RequestPromiseOptions) => Promise<any>;
export default rp;
