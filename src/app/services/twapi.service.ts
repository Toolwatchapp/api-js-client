import { Injectable } from '@angular/core';
import { Http, HTTP_PROVIDERS, RequestOptions, Headers, Response }  from '@angular/http';
import { User }  from './../models/user.model';
import { Watch, WatchAction }  from './../models/watch.model';
import { Measure, MeasureStatus }  from './../models/measure.model';
import { ModelFactory }  from './../models/model.factory';
import { BlogPost } from './../models/blog-post.model'
import { GAService } from './ga.service';

import 'rxjs/add/operator/toPromise';

@Injectable()
/**
 * Exposes the Toolwatch API.
 * Returns promeses on domain objects
 */
export class TwAPIService {

	/**
	 * All the HTTP code used by the toolwatch API are defined here.
	 * Http codes can be to refine the error types
	 */
	public static HTTP_CONTINUE = 100;
    public static HTTP_SWITCHING_PROTOCOLS = 101;
    public static HTTP_PROCESSING = 102;            // RFC2518

    // Success

    /**
     * The request has succeeded
     */
    public static HTTP_OK = 200;

    /**
     * The server successfully created a new resource
     */
    public static HTTP_CREATED = 201;
    public static HTTP_ACCEPTED = 202;
    public static HTTP_NON_AUTHORITATIVE_INFORMATION = 203;

    /**
     * The server successfully processed the request, though no content is returned
     */
    public static HTTP_NO_CONTENT = 204;
    public static HTTP_RESET_CONTENT = 205;
    public static HTTP_PARTIAL_CONTENT = 206;
    public static HTTP_MULTI_STATUS = 207;          // RFC4918
    public static HTTP_ALREADY_REPORTED = 208;      // RFC5842
    public static HTTP_IM_USED = 226;               // RFC3229

    // Redirection

    public static HTTP_MULTIPLE_CHOICES = 300;
    public static HTTP_MOVED_PERMANENTLY = 301;
    public static HTTP_FOUND = 302;
    public static HTTP_SEE_OTHER = 303;

    /**
     * The resource has not been modified since the last request
     */
    public static HTTP_NOT_MODIFIED = 304;
    public static HTTP_USE_PROXY = 305;
    public static HTTP_RESERVED = 306;
    public static HTTP_TEMPORARY_REDIRECT = 307;
    public static HTTP_PERMANENTLY_REDIRECT = 308;  // RFC7238

    // Client Error

    /**
     * The request cannot be fulfilled due to multiple errors
     */
    public static HTTP_BAD_REQUEST = 400;

    /**
     * The user is unauthorized to access the requested resource
     */
    public static HTTP_UNAUTHORIZED = 401;
    public static HTTP_PAYMENT_REQUIRED = 402;

    /**
     * The requested resource is unavailable at this present time
     */
    public static HTTP_FORBIDDEN = 403;

    /**
     * The requested resource could not be found
     *
     * Note: This is sometimes used to mask if there was an UNAUTHORIZED (401) or
     * FORBIDDEN (403) error, for security reasons
     */
    public static HTTP_NOT_FOUND = 404;

    /**
     * The request method is not supported by the following resource
     */
    public static HTTP_METHOD_NOT_ALLOWED = 405;

    /**
     * The request was not acceptable
     */
    public static HTTP_NOT_ACCEPTABLE = 406;
    public static HTTP_PROXY_AUTHENTICATION_REQUIRED = 407;
    public static HTTP_REQUEST_TIMEOUT = 408;

    /**
     * The request could not be completed due to a conflict with the current state
     * of the resource
     */
    public static HTTP_CONFLICT = 409;
    public static HTTP_GONE = 410;
    public static HTTP_LENGTH_REQUIRED = 411;
    public static HTTP_PRECONDITION_FAILED = 412;
    public static HTTP_REQUEST_ENTITY_TOO_LARGE = 413;
    public static HTTP_REQUEST_URI_TOO_LONG = 414;
    public static HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
    public static HTTP_REQUESTED_RANGE_NOT_SATISFIABLE = 416;
    public static HTTP_EXPECTATION_FAILED = 417;
    public static HTTP_I_AM_A_TEAPOT = 418;                                               // RFC2324
    public static HTTP_UNPROCESSABLE_ENTITY = 422;                                        // RFC4918
    public static HTTP_LOCKED = 423;                                                      // RFC4918
    public static HTTP_FAILED_DEPENDENCY = 424;                                           // RFC4918
    public static HTTP_RESERVED_FOR_WEBDAV_ADVANCED_COLLECTIONS_EXPIRED_PROPOSAL = 425;   // RFC2817
    public static HTTP_UPGRADE_REQUIRED = 426;                                            // RFC2817
    public static HTTP_PRECONDITION_REQUIRED = 428;                                       // RFC6585
    public static HTTP_TOO_MANY_REQUESTS = 429;                                           // RFC6585
    public static HTTP_REQUEST_HEADER_FIELDS_TOO_LARGE = 431;                             // RFC6585

    // Server Error

    /**
     * The server encountered an unexpected error
     *
     * Note: This is a generic error message when no specific message
     * is suitable
     */
    public static HTTP_INTERNAL_SERVER_ERROR = 500;

    /**
     * The server does not recognise the request method
     */
    public static HTTP_NOT_IMPLEMENTED = 501;
    public static HTTP_BAD_GATEWAY = 502;
    public static HTTP_SERVICE_UNAVAILABLE = 503;
    public static HTTP_GATEWAY_TIMEOUT = 504;
    public static HTTP_VERSION_NOT_SUPPORTED = 505;
    public static HTTP_VARIANT_ALSO_NEGOTIATES_EXPERIMENTAL = 506;                        // RFC2295
    public static HTTP_INSUFFICIENT_STORAGE = 507;                                        // RFC4918
    public static HTTP_LOOP_DETECTED = 508;                                               // RFC5842
    public static HTTP_NOT_EXTENDED = 510;                                                // RFC2774
    public static HTTP_NETWORK_AUTHENTICATION_REQUIRED = 511;

    public static user:User;
    private static time:{
    	syncDate:Date,
    	syncAnchor:number,
    	offset:number
    }

	//Defines headers and request options
	private static headers: Headers = new Headers({ 'Content-Type': 'application/json' });
	private static options: RequestOptions = new RequestOptions({ headers: TwAPIService.headers });
	
	private baseUrl:string = "https://toolwatch.io/api/";
	public static assetsUrl = "app/assets"
	private static apikey:string;

	/**
	 * Inject http service
	 * @param {Http} private http 
	 */
	constructor(private http: Http) {

		this.accurateTime();
	}

	public static resetTime(){
		TwAPIService.time = undefined;
	}

	/**
	 * Log a user using email and password
	 * @param  {string}        email   
	 * @param  {string}        password
	 * @return {Promise<User>}         
	 */
	login(email: string, password: string): Promise<User> {

		let creds = { email: email, password: password };
		return this.http.put(
			this.baseUrl + "users", 
			JSON.stringify(creds), 
			TwAPIService.options
		)
		.map((res) => { return ModelFactory.buildUser(res.json()); })
		.toPromise().then(
			res => {
                GAService.event('API', 'LOGIN');
				TwAPIService.apikey = res.key;
				TwAPIService.headers.delete('X-API-KEY');
				TwAPIService.headers.append('X-API-KEY', TwAPIService.apikey);
				TwAPIService.user = res;
				return res;
			},
            err => this.handleError(err)
		)
	}  


    /**
     * Get an user using his API key
     * @param  {string}        key [description]
     * @return {Promise<User>}     [description]
     */
    getUser(key:string):Promise<User> {

        
        TwAPIService.apikey = key;
        TwAPIService.headers.delete('X-API-KEY');
        TwAPIService.headers.append('X-API-KEY', TwAPIService.apikey);
        

        return this.http.get(
            this.baseUrl + "users", 
            TwAPIService.options
        )
        .map((res) => { return ModelFactory.buildUser(res.json()); })
        .toPromise().then(
            res => {

                GAService.event('API', 'AUTOLOGIN');
                TwAPIService.user = res;
                return res;
            },
            err => this.handleError(err)
        )

    }

	/**
	 * Registers a new user
	 * @param  {string}        email   
	 * @param  {string}        password
	 * @param  {string}        name    
	 * @param  {string}        lastname
	 * @param  {string}        country 
	 * @return {Promise<User>}         
	 */
	signup(email: string, password: string, name?: string, lastname?: string, country?: string): Promise<User> {

		return this.http.post(
			this.baseUrl + "users",
			JSON.stringify({
				email: email, 
				password: password,
				name: name,
				lastname: lastname,
				country:country
			}),
			TwAPIService.options
		)
		.map((res) => { return ModelFactory.buildUser(res.json()); })
		.toPromise().then(
			res => {
                GAService.event('API', 'SIGNUP');
                return res;
            }
		);
	}

	/**
	 * Deletes the account currently logged in.
	 * @return {Promise<boolean>}
	 */
	deleteAccount():Promise<boolean>{

		return this.http.delete(
			this.baseUrl + "users",
			TwAPIService.options
		).toPromise().then(
			response => {
                GAService.event('API', 'DELETE_ACCOUNT');
                return true;
            }
		).catch(this.handleError);
	}

	getWatches(): Promise<Watch[]>{
		return this.http.get(
			this.baseUrl + "watches",
			TwAPIService.options)
		.map((res) => { return ModelFactory.buildWatches(res.json()); })
		.toPromise().then(
			res => {
                GAService.event('API', 'WATCHES', 'GET');
                return res
            }
		);
	}

	/**
	 * Update or insert a watch
	 * @param  {Watch}          watch
	 * @return {Promise<Watch>}      
	 */
	upsertWatch(watch: Watch): Promise<Watch> {

		if(watch.id == null){
			return this.insertWatch(watch);
		}else{
			return this.updateWatch(watch);
		}
	}

	/**
	 * Deletes a watch and update the user accordingly
	 * @param  {User}          user  
	 * @param  {Watch}         watch 
	 * @return {Promise<User>}       
	 */
	deleteWatch(user:User, watch:Watch):Promise<User>{
		let deleteOptions = new RequestOptions({ headers: TwAPIService.headers });
		deleteOptions.body = JSON.stringify({ watchId: watch.id });

		return this.http.delete(
			this.baseUrl + "watches",
			deleteOptions
		).toPromise().then(
			response => {

				user.watches = user.watches.filter(
					function(filter: Watch) {
						return filter.id != watch.id;
					}
				);

                GAService.event('API', 'WATCHES', 'DELETE');

				return user;
			}
		);
	}

	/**
	 * Insert or update a measure and the related watch
	 * @param  {Watch}          watch  
	 * @param  {Measure}        measure
	 * @return {Promise<Watch>}        
	 */
	upsertMeasure(watch: Watch, measure: Measure): Promise<Watch> {
		if(measure.id == null){
			return this.insertMeasure(watch, measure);
		}else{
			return this.updateMeasure(watch, measure);
		}
	}

	/**
	 * Delete a measure and the update the related watch
	 * @param  {Watch}          watch  
	 * @param  {Measure}        measure
	 * @return {Promise<Watch>}        
	 */
	deleteMeasure(watch: Watch, measure: Measure): Promise<Watch> {

		let deleteOptions = new RequestOptions({ headers: TwAPIService.headers });
		deleteOptions.body = JSON.stringify({measureId:measure.id});

		return this.http.delete(
			this.baseUrl + "measures",
			deleteOptions
		).toPromise().then(
			response => {

				watch.measures = watch.measures.filter(
					function(filter: Measure) {
						return filter.id != measure.id;
					}
				);

                GAService.event('API', 'MEASURE', 'DELETE');

				return watch;
			}
		).catch(this.handleError);
	}

	getBlogPosts(): Promise<BlogPost[]>{
		return this.http.get(
			"https://blog.toolwatch.io/?json=1"
		)
		.map((res) => { return ModelFactory.buildPosts(res.json()); })
		.toPromise().then(
			res => {
                GAService.event('API', 'BLOG', 'GET');
                return res
            }
		);
	}

	/**
	 * Return known brands
	 * @return {Promise} 
	 */
	getBrands(): Promise<[{ name: string, icon: string, models:string}]> {
		return this.http.get(
			TwAPIService.assetsUrl + '/json/watch-brand.json')
		.map(res => res.json())
		.toPromise().then(
			brands => {
                GAService.event('API', 'BRANDS', 'GET');
                return brands;
            }
		);
	}

	/**
	 * Returns model of a given brand
	 * @param  {string}  brand
	 * @return {Promise}      
	 */
	getModels(brand:string): Promise<[string]> {
		return this.http.get(
			TwAPIService.assetsUrl + '/json/watch-models/' + brand + ".json")
			.map(res => res.json())
			.toPromise().then(
			models => {
                GAService.event('API', 'MODELS', 'GET');
                return models
            }
		);
	}

	/**
	 * Gets the previously computed offset
	 * @return {number} [description]
	 */
	getOffsetTime():number{
		return TwAPIService.time.offset;
	}

	/**
	 * Retrieve atomic clock time adjusted for network latency
	 * @param  {()=>void} statusCallback Called at each partial complete
	 * @param  {number = 0} precison How many calls we want to aveage
	 * @return {Promise<Date>} 
	 */
	accurateTime(statusCallback?:()=>void, 
		precison:number = 10): Promise<Date>{

        GAService.event('API', 'TIME', 'GET');


		//If we aren't already sync'ed
		if(TwAPIService.time === undefined){
			//Stores each Promise in array
			let promises:Promise<number>[] = [];
			for (var i = 0; i < precison; ++i) {
				promises.push(this.fetchTime(statusCallback));
			}

			/**
			 * Promise.all() is the Promise equivalent of thread.join().
			 * It'll wait for all promises to be received. 
			 *
			 * Returns a date adjusted w/ the median offset between 
			 * atomic clock and js time. 
			 * The offset received in each promise also accounts for
			 * the network roundtrip time.
			 */
			return Promise.all(promises).then((results:any[]) => {
				results.sort(function(a: any, b: any) { return a - b; });

				let half: number = Math.floor(results.length / 2);
				let medianOffset;

				if (results.length % 2) {
					medianOffset = results[half];
				} else {
					medianOffset = (results[half - 1] + results[half]) / 2.0;
				}

				TwAPIService.time = {
					syncDate: new Date(Date.now() - medianOffset),
					syncAnchor: window.performance.now(),
					offset:medianOffset
				};

				console.log(TwAPIService.time);

				return TwAPIService.time.syncDate;
			});
		//Only compute the difference from last time;
		}else{

			TwAPIService.time.syncDate = new Date(
				TwAPIService.time.syncDate.getTime() +
				window.performance.now() - TwAPIService.time.syncAnchor
			);
			
			TwAPIService.time.syncAnchor = window.performance.now();

			return new Promise<Date>(
				(resolve, reject) => { 
					console.log(TwAPIService.time);
					resolve(TwAPIService.time.syncDate); 
				}
			);
		}
	}

	/**
	 * Fetch offset between atomic clock and js time
	 * @param {() => void} statusCallback
	 */
	private fetchTime(statusCallback?: () => void)
		: Promise<number> {

		let beforeTime: number = window.performance.now();
		return this.http.get(
			this.baseUrl + "time",
			TwAPIService.options).toPromise().then(
			response => {

				if (statusCallback !== undefined){
					statusCallback();
				}

				let now: number = window.performance.now();
				let timeDiff = (now - beforeTime) / 2;
				let serverTime = response.json().time - timeDiff;
				return Date.now() - serverTime;
			}
		).catch(this.handleError);
	}

	/**
	 * Update a measure and the watch it belongs to
	 * @param  {Watch}          watch  
	 * @param  {Measure}        measure
	 * @return {Promise<Watch>}        
	 */
	private updateMeasure(watch: Watch, measure: Measure): Promise<Watch> {
		return this.http.put(
			this.baseUrl + "measures",
			JSON.stringify({
				measureId: measure.id,
				referenceTime: measure.accuracyReferenceTime,
				userTime: measure.accuracyUserTime
			}),
			TwAPIService.options
		).toPromise().then(
			response => {
                GAService.event('API', 'MEASURE', 'SECOND');
				let json = response.json().result;
				measure.addAccuracy(json.accuracy, json.accuracyAge, json.percentile);
				watch.upsertMeasure(measure);
				watch.next = WatchAction.Measure;
				return watch;
			}
		).catch(this.handleError);
	}

	/**
	 * Insert a measure and the watch it belongs to
	 * @param  {Watch}          watch  
	 * @param  {Measure}        measure
	 * @return {Promise<Watch>}        
	 */
	private insertMeasure(watch: Watch, measure: Measure): Promise<Watch> {
		return this.http.post(
			this.baseUrl + "measures",
			JSON.stringify({
				watchId: watch.id,
				referenceTime: measure.measureReferenceTime,
				userTime: measure.measureUserTime
			}),
			TwAPIService.options
		).toPromise().then(
			response => {
                GAService.event('API', 'MEASURE', 'FIRST');
				measure.id = response.json().measureId;
				watch.measures.push(measure);
				return watch;
			}
		).catch(this.handleError);
	}

	/**
	 * Insert a watch
	 * @param  {Watch}          watch
	 * @return {Promise<Watch>}      
	 */
	private insertWatch(watch: Watch):Promise<Watch>{
		return this.http.post(
			this.baseUrl + "watches",
			JSON.stringify({
				brand: watch.brand,
				name:watch.name,
				yearOfBuy:watch.yearOfBuy,
				serial: watch.serial,
				caliber:watch.caliber
			}),
			TwAPIService.options
		).toPromise().then(
			response => {
				watch.id = response.json().id;
                GAService.event('API', 'WATCH', 'PUT');
				return watch;
			}
		);
	}

	/**
	 * Update a watch
	 * @param  {Watch}          watch
	 * @return {Promise<Watch>}      
	 */
	private updateWatch(watch: Watch): Promise<Watch> {
		return this.http.put(
			this.baseUrl + "watches",
			JSON.stringify({
				id: watch.id,
				brand: watch.brand,
				name: watch.name,
				yearOfBuy: watch.yearOfBuy,
				serial: watch.serial,
				caliber: watch.caliber
			}),
			TwAPIService.options
		).toPromise().then(
			response => {
                GAService.event('API', 'WATCH', 'UPDATE');
				return watch;
			}
		);
	}


	/**
	 * Log error to console
	 * @param {any} error [description]
	 */
	private handleError(error: any) {
		console.error('An error occurred', error);
        return Promise.reject(error.message || error);
	}

}
