export interface GoogleLocation {
    lat: number;
    lng: number;
}
export declare type Point = GoogleLocation;
/**
 * Represents a person or event for whom a chart will be created
 */
export declare class Person {
    name: string;
    date: string;
    location: Point;
    /**
     * Google API key
     * @type {string}
     */
    private static _key;
    /**
     * Creates a Person object
     * @param {string} public name Name of the person or event
     * @param {string} public date UTC date in ISO 8601 format, i.e. YYYY-MM-DDTHH:mmZ (caller must convert to UTC)
     * @param {Point} location The [lat: number, lon: number] of the event or person's birthplace
     */
    constructor(name: string, date: string, location: Point);
    /**
     * Asynchronous factory function for creating people or events
     * @param  {string}          name     Name of the person or event
     * @param  {Date | string}   date     Exact datetime for the chart, preferably UTC date in ISO 8601 format, i.e. YYYY-MM-DDTHH:mmZ (caller must convert to UTC)
     * @param  {Point | string}  location Either an address or a lat/lng combination
     * @return {Promise<Person>}          The Person object that was created
     */
    static create(name: string, date: Date | string, location: Point | string): Promise<Person>;
    /**
     * Gets a timezone given a latitude and longitude
     * @param {Point} p  Contains the latitude and longitude in decimal format
     */
    static getTimezone(p: Point): Promise<string>;
    /**
     * Get a latitude and longitude given an address
     * @param {string} address The address of the desired lat/lon
     */
    static getLatLon(address: string): Promise<Point>;
}
