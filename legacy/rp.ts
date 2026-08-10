import * as http from "http";
import * as https from "https";

export interface RequestPromiseOptions {
    uri: string;
    qs: {[name: string]: string|number|boolean};
}

const uri = (options: RequestPromiseOptions): string => {
    let url: string = options.uri,
        qs:  string = Object.keys(options.qs).map(key => {
            return `${encodeURIComponent(key)}=${encodeURIComponent(options.qs[key].toString())}`;
        }).join("&");
    return `${url}?${qs}`;
};

const rp = (options: RequestPromiseOptions): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
        const http = require("http");
        const lib = options.uri.startsWith("https") ? https : http;
        const url = uri(options);
        const req = lib.get(url, (response: http.ServerResponse) => {
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error("HTTP Error: " + response.statusCode));
            }
            const body: string[] = [];
            response.on("data", (chunk: string) => body.push(chunk));
            response.on("end", () => resolve(JSON.parse(body.join(""))));
        });
        req.on("error", (err: Error) => reject(err));
    });
};

export default rp;