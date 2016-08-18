"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var http_1 = require('@angular/http');
var watch_model_1 = require('./../models/watch.model');
var model_factory_1 = require('./../models/model.factory');
var ga_service_1 = require('./ga.service');
require('rxjs/add/operator/toPromise');
var aspect_1 = require('aspect.js/dist/lib/aspect');
var logger_aspect_1 = require('./../aspects/logger.aspect');
var TwAPIService = (function () {
    /**
     * Inject http service
     * @param {Http} private http
     */
    function TwAPIService(http) {
        this.http = http;
        this.baseUrl = "https://toolwatch.io/api/";
        console.log('in');
        // this.accurateTime();
    }
    TwAPIService.resetTime = function () {
        TwAPIService.time = undefined;
    };
    /**
     * Log a user using email and password
     * @param  {string}        email
     * @param  {string}        password
     * @return {Promise<User>}
     */
    TwAPIService.prototype.login = function (email, password) {
        var _this = this;
        var creds = { email: email, password: password };
        return this.http.put(this.baseUrl + "users", JSON.stringify(creds), TwAPIService.options)
            .map(function (res) { return model_factory_1.ModelFactory.buildUser(res.json()); })
            .toPromise().then(function (res) {
            ga_service_1.GAService.event('API', 'LOGIN');
            TwAPIService.apikey = res.key;
            TwAPIService.headers.delete('X-API-KEY');
            TwAPIService.headers.append('X-API-KEY', TwAPIService.apikey);
            TwAPIService.user = res;
            return res;
        }, function (err) { return _this.handleError(err); });
    };
    /**
     * Get an user using his API key
     * @param  {string}        key [description]
     * @return {Promise<User>}     [description]
     */
    TwAPIService.prototype.getUser = function (key) {
        var _this = this;
        TwAPIService.apikey = key;
        TwAPIService.headers.delete('X-API-KEY');
        TwAPIService.headers.append('X-API-KEY', TwAPIService.apikey);
        return this.http.get(this.baseUrl + "users", TwAPIService.options)
            .map(function (res) { return model_factory_1.ModelFactory.buildUser(res.json()); })
            .toPromise().then(function (res) {
            ga_service_1.GAService.event('API', 'AUTOLOGIN');
            TwAPIService.user = res;
            return res;
        }, function (err) { return _this.handleError(err); });
    };
    /**
     * Registers a new user
     * @param  {string}        email
     * @param  {string}        password
     * @param  {string}        name
     * @param  {string}        lastname
     * @param  {string}        country
     * @return {Promise<User>}
     */
    TwAPIService.prototype.signup = function (email, password, name, lastname, country) {
        return this.http.post(this.baseUrl + "users", JSON.stringify({
            email: email,
            password: password,
            name: name,
            lastname: lastname,
            country: country
        }), TwAPIService.options)
            .map(function (res) { return model_factory_1.ModelFactory.buildUser(res.json()); })
            .toPromise().then(function (res) {
            ga_service_1.GAService.event('API', 'SIGNUP');
            return res;
        });
    };
    /**
     * Deletes the account currently logged in.
     * @return {Promise<boolean>}
     */
    TwAPIService.prototype.deleteAccount = function () {
        return this.http.delete(this.baseUrl + "users", TwAPIService.options).toPromise().then(function (response) {
            ga_service_1.GAService.event('API', 'DELETE_ACCOUNT');
            return true;
        }).catch(this.handleError);
    };
    TwAPIService.prototype.getWatches = function () {
        return this.http.get(this.baseUrl + "watches", TwAPIService.optionsGet)
            .map(function (res) { return model_factory_1.ModelFactory.buildWatches(res.json()); })
            .toPromise().then(function (res) {
            ga_service_1.GAService.event('API', 'WATCHES', 'GET');
            return res;
        });
    };
    /**
     * Update or insert a watch
     * @param  {Watch}          watch
     * @return {Promise<Watch>}
     */
    TwAPIService.prototype.upsertWatch = function (watch) {
        if (watch.id == null) {
            return this.insertWatch(watch);
        }
        else {
            return this.updateWatch(watch);
        }
    };
    /**
     * Deletes a watch and update the user accordingly
     * @param  {User}          user
     * @param  {Watch}         watch
     * @return {Promise<User>}
     */
    TwAPIService.prototype.deleteWatch = function (user, watch) {
        var deleteOptions = new http_1.RequestOptions({ headers: TwAPIService.headers });
        deleteOptions.body = JSON.stringify({ watchId: watch.id });
        return this.http.delete(this.baseUrl + "watches", deleteOptions).toPromise().then(function (response) {
            user.watches = user.watches.filter(function (filter) {
                return filter.id != watch.id;
            });
            ga_service_1.GAService.event('API', 'WATCHES', 'DELETE');
            return user;
        });
    };
    /**
     * Insert or update a measure and the related watch
     * @param  {Watch}          watch
     * @param  {Measure}        measure
     * @return {Promise<Watch>}
     */
    TwAPIService.prototype.upsertMeasure = function (watch, measure) {
        if (measure.id == null) {
            return this.insertMeasure(watch, measure);
        }
        else {
            return this.updateMeasure(watch, measure);
        }
    };
    /**
     * Delete a measure and the update the related watch
     * @param  {Watch}          watch
     * @param  {Measure}        measure
     * @return {Promise<Watch>}
     */
    TwAPIService.prototype.deleteMeasure = function (watch, measure) {
        var deleteOptions = new http_1.RequestOptions({ headers: TwAPIService.headers });
        deleteOptions.body = JSON.stringify({ measureId: measure.id });
        return this.http.delete(this.baseUrl + "measures", deleteOptions).toPromise().then(function (response) {
            watch.measures = watch.measures.filter(function (filter) {
                return filter.id != measure.id;
            });
            ga_service_1.GAService.event('API', 'MEASURE', 'DELETE');
            return watch;
        }).catch(this.handleError);
    };
    TwAPIService.prototype.getBlogPosts = function () {
        return this.http.get("https://blog.toolwatch.io/?json=1")
            .map(function (res) { return model_factory_1.ModelFactory.buildPosts(res.json()); })
            .toPromise().then(function (res) {
            ga_service_1.GAService.event('API', 'BLOG', 'GET');
            return res;
        });
    };
    /**
     * Return known brands
     * @return {Promise}
     */
    TwAPIService.prototype.getBrands = function () {
        return this.http.get(TwAPIService.assetsUrl + '/json/watch-brand.json')
            .map(function (res) { return res.json(); })
            .toPromise().then(function (brands) {
            ga_service_1.GAService.event('API', 'BRANDS', 'GET');
            return brands;
        });
    };
    /**
     * Returns model of a given brand
     * @param  {string}  brand
     * @return {Promise}
     */
    TwAPIService.prototype.getModels = function (brand) {
        return this.http.get(TwAPIService.assetsUrl + '/json/watch-models/' + brand + ".json")
            .map(function (res) { return res.json(); })
            .toPromise().then(function (models) {
            ga_service_1.GAService.event('API', 'MODELS', 'GET');
            return models;
        });
    };
    /**
     * Gets the previously computed offset
     * @return {number} [description]
     */
    TwAPIService.prototype.getOffsetTime = function () {
        return TwAPIService.time.offset;
    };
    /**
     * Retrieve atomic clock time adjusted for network latency
     * @param  {()=>void} statusCallback Called at each partial complete
     * @param  {number = 0} precison How many calls we want to aveage
     * @return {Promise<Date>}
     */
    TwAPIService.prototype.accurateTime = function (statusCallback, precison) {
        if (precison === void 0) { precison = 10; }
        ga_service_1.GAService.event('API', 'TIME', 'GET');
        //If we aren't already sync'ed
        if (TwAPIService.time === undefined) {
            //Stores each Promise in array
            var promises = [];
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
            return Promise.all(promises).then(function (results) {
                results.sort(function (a, b) { return a - b; });
                var half = Math.floor(results.length / 2);
                var medianOffset;
                if (results.length % 2) {
                    medianOffset = results[half];
                }
                else {
                    medianOffset = (results[half - 1] + results[half]) / 2.0;
                }
                TwAPIService.time = {
                    syncDate: new Date(Date.now() - medianOffset),
                    syncAnchor: window.performance.now(),
                    offset: medianOffset
                };
                console.log(TwAPIService.time);
                return TwAPIService.time.syncDate;
            });
        }
        else {
            TwAPIService.time.syncDate = new Date(TwAPIService.time.syncDate.getTime() +
                window.performance.now() - TwAPIService.time.syncAnchor);
            TwAPIService.time.syncAnchor = window.performance.now();
            return new Promise(function (resolve, reject) {
                console.log(TwAPIService.time);
                resolve(TwAPIService.time.syncDate);
            });
        }
    };
    /**
     * Fetch offset between atomic clock and js time
     * @param {() => void} statusCallback
     */
    TwAPIService.prototype.fetchTime = function (statusCallback) {
        var beforeTime = window.performance.now();
        console.log("beforeTime", beforeTime);
        console.log("TwAPIService.options", TwAPIService.optionsGet);
        console.log("this.baseUrl", this.baseUrl);
        return this.http.get(this.baseUrl + "time", TwAPIService.optionsGet)
            .toPromise()
            .then(function (response) {
            console.log("response", response);
            if (statusCallback !== undefined) {
                statusCallback();
            }
            var now = window.performance.now();
            var timeDiff = (now - beforeTime) / 2;
            var serverTime = response.json().time - timeDiff;
            return Date.now() - serverTime;
        }, function (reject) { return console.error(reject); }).catch(this.handleError);
    };
    /**
     * Update a measure and the watch it belongs to
     * @param  {Watch}          watch
     * @param  {Measure}        measure
     * @return {Promise<Watch>}
     */
    TwAPIService.prototype.updateMeasure = function (watch, measure) {
        return this.http.put(this.baseUrl + "measures", JSON.stringify({
            measureId: measure.id,
            referenceTime: measure.accuracyReferenceTime,
            userTime: measure.accuracyUserTime
        }), TwAPIService.options).toPromise().then(function (response) {
            ga_service_1.GAService.event('API', 'MEASURE', 'SECOND');
            var json = response.json().result;
            measure.addAccuracy(json.accuracy, json.accuracyAge, json.percentile);
            watch.upsertMeasure(measure);
            watch.next = watch_model_1.WatchAction.Measure;
            return watch;
        }).catch(this.handleError);
    };
    /**
     * Insert a measure and the watch it belongs to
     * @param  {Watch}          watch
     * @param  {Measure}        measure
     * @return {Promise<Watch>}
     */
    TwAPIService.prototype.insertMeasure = function (watch, measure) {
        return this.http.post(this.baseUrl + "measures", JSON.stringify({
            watchId: watch.id,
            referenceTime: measure.measureReferenceTime,
            userTime: measure.measureUserTime
        }), TwAPIService.options).toPromise().then(function (response) {
            ga_service_1.GAService.event('API', 'MEASURE', 'FIRST');
            measure.id = response.json().measureId;
            watch.measures.push(measure);
            return watch;
        }).catch(this.handleError);
    };
    /**
     * Insert a watch
     * @param  {Watch}          watch
     * @return {Promise<Watch>}
     */
    TwAPIService.prototype.insertWatch = function (watch) {
        return this.http.post(this.baseUrl + "watches", JSON.stringify({
            brand: watch.brand,
            name: watch.name,
            yearOfBuy: watch.yearOfBuy,
            serial: watch.serial,
            caliber: watch.caliber
        }), TwAPIService.options).toPromise().then(function (response) {
            watch.id = response.json().id;
            ga_service_1.GAService.event('API', 'WATCH', 'PUT');
            return watch;
        });
    };
    /**
     * Update a watch
     * @param  {Watch}          watch
     * @return {Promise<Watch>}
     */
    TwAPIService.prototype.updateWatch = function (watch) {
        return this.http.put(this.baseUrl + "watches", JSON.stringify({
            id: watch.id,
            brand: watch.brand,
            name: watch.name,
            yearOfBuy: watch.yearOfBuy,
            serial: watch.serial,
            caliber: watch.caliber
        }), TwAPIService.options).toPromise().then(function (response) {
            ga_service_1.GAService.event('API', 'WATCH', 'UPDATE');
            return watch;
        });
    };
    /**
     * Log error to console
     * @param {any} error [description]
     */
    TwAPIService.prototype.handleError = function (error) {
        console.error('An error occurred', error || "plop");
        return Promise.reject(error.message || error);
    };
    /**
     * All the HTTP code used by the toolwatch API are defined here.
     * Http codes can be to refine the error types
     */
    TwAPIService.HTTP_CONTINUE = 100;
    TwAPIService.HTTP_SWITCHING_PROTOCOLS = 101;
    TwAPIService.HTTP_PROCESSING = 102; // RFC2518
    // Success
    /**
     * The request has succeeded
     */
    TwAPIService.HTTP_OK = 200;
    /**
     * The server successfully created a new resource
     */
    TwAPIService.HTTP_CREATED = 201;
    TwAPIService.HTTP_ACCEPTED = 202;
    TwAPIService.HTTP_NON_AUTHORITATIVE_INFORMATION = 203;
    /**
     * The server successfully processed the request, though no content is returned
     */
    TwAPIService.HTTP_NO_CONTENT = 204;
    TwAPIService.HTTP_RESET_CONTENT = 205;
    TwAPIService.HTTP_PARTIAL_CONTENT = 206;
    TwAPIService.HTTP_MULTI_STATUS = 207; // RFC4918
    TwAPIService.HTTP_ALREADY_REPORTED = 208; // RFC5842
    TwAPIService.HTTP_IM_USED = 226; // RFC3229
    // Redirection
    TwAPIService.HTTP_MULTIPLE_CHOICES = 300;
    TwAPIService.HTTP_MOVED_PERMANENTLY = 301;
    TwAPIService.HTTP_FOUND = 302;
    TwAPIService.HTTP_SEE_OTHER = 303;
    /**
     * The resource has not been modified since the last request
     */
    TwAPIService.HTTP_NOT_MODIFIED = 304;
    TwAPIService.HTTP_USE_PROXY = 305;
    TwAPIService.HTTP_RESERVED = 306;
    TwAPIService.HTTP_TEMPORARY_REDIRECT = 307;
    TwAPIService.HTTP_PERMANENTLY_REDIRECT = 308; // RFC7238
    // Client Error
    /**
     * The request cannot be fulfilled due to multiple errors
     */
    TwAPIService.HTTP_BAD_REQUEST = 400;
    /**
     * The user is unauthorized to access the requested resource
     */
    TwAPIService.HTTP_UNAUTHORIZED = 401;
    TwAPIService.HTTP_PAYMENT_REQUIRED = 402;
    /**
     * The requested resource is unavailable at this present time
     */
    TwAPIService.HTTP_FORBIDDEN = 403;
    /**
     * The requested resource could not be found
     *
     * Note: This is sometimes used to mask if there was an UNAUTHORIZED (401) or
     * FORBIDDEN (403) error, for security reasons
     */
    TwAPIService.HTTP_NOT_FOUND = 404;
    /**
     * The request method is not supported by the following resource
     */
    TwAPIService.HTTP_METHOD_NOT_ALLOWED = 405;
    /**
     * The request was not acceptable
     */
    TwAPIService.HTTP_NOT_ACCEPTABLE = 406;
    TwAPIService.HTTP_PROXY_AUTHENTICATION_REQUIRED = 407;
    TwAPIService.HTTP_REQUEST_TIMEOUT = 408;
    /**
     * The request could not be completed due to a conflict with the current state
     * of the resource
     */
    TwAPIService.HTTP_CONFLICT = 409;
    TwAPIService.HTTP_GONE = 410;
    TwAPIService.HTTP_LENGTH_REQUIRED = 411;
    TwAPIService.HTTP_PRECONDITION_FAILED = 412;
    TwAPIService.HTTP_REQUEST_ENTITY_TOO_LARGE = 413;
    TwAPIService.HTTP_REQUEST_URI_TOO_LONG = 414;
    TwAPIService.HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
    TwAPIService.HTTP_REQUESTED_RANGE_NOT_SATISFIABLE = 416;
    TwAPIService.HTTP_EXPECTATION_FAILED = 417;
    TwAPIService.HTTP_I_AM_A_TEAPOT = 418; // RFC2324
    TwAPIService.HTTP_UNPROCESSABLE_ENTITY = 422; // RFC4918
    TwAPIService.HTTP_LOCKED = 423; // RFC4918
    TwAPIService.HTTP_FAILED_DEPENDENCY = 424; // RFC4918
    TwAPIService.HTTP_RESERVED_FOR_WEBDAV_ADVANCED_COLLECTIONS_EXPIRED_PROPOSAL = 425; // RFC2817
    TwAPIService.HTTP_UPGRADE_REQUIRED = 426; // RFC2817
    TwAPIService.HTTP_PRECONDITION_REQUIRED = 428; // RFC6585
    TwAPIService.HTTP_TOO_MANY_REQUESTS = 429; // RFC6585
    TwAPIService.HTTP_REQUEST_HEADER_FIELDS_TOO_LARGE = 431; // RFC6585
    // Server Error
    /**
     * The server encountered an unexpected error
     *
     * Note: This is a generic error message when no specific message
     * is suitable
     */
    TwAPIService.HTTP_INTERNAL_SERVER_ERROR = 500;
    /**
     * The server does not recognise the request method
     */
    TwAPIService.HTTP_NOT_IMPLEMENTED = 501;
    TwAPIService.HTTP_BAD_GATEWAY = 502;
    TwAPIService.HTTP_SERVICE_UNAVAILABLE = 503;
    TwAPIService.HTTP_GATEWAY_TIMEOUT = 504;
    TwAPIService.HTTP_VERSION_NOT_SUPPORTED = 505;
    TwAPIService.HTTP_VARIANT_ALSO_NEGOTIATES_EXPERIMENTAL = 506; // RFC2295
    TwAPIService.HTTP_INSUFFICIENT_STORAGE = 507; // RFC4918
    TwAPIService.HTTP_LOOP_DETECTED = 508; // RFC5842
    TwAPIService.HTTP_NOT_EXTENDED = 510; // RFC2774
    TwAPIService.HTTP_NETWORK_AUTHENTICATION_REQUIRED = 511;
    //Defines headers and request options
    TwAPIService.headers = new http_1.Headers({ 'Content-Type': 'application/json' });
    TwAPIService.options = new http_1.RequestOptions({ headers: TwAPIService.headers });
    // Regression RC5. Doesn't accept get without body
    TwAPIService.optionsGet = new http_1.RequestOptions({ headers: TwAPIService.headers, body: "" });
    TwAPIService.assetsUrl = "app/assets";
    TwAPIService = __decorate([
        aspect_1.Wove(logger_aspect_1.LoggerAspect),
        core_1.Injectable(), 
        __metadata('design:paramtypes', [http_1.Http])
    ], TwAPIService);
    return TwAPIService;
}());
exports.TwAPIService = TwAPIService;
//# sourceMappingURL=../../twapi.service.js.map