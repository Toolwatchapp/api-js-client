import { Component, Output, EventEmitter } from '@angular/core';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { TwAPIService } from './../../services/twapi.service';
import { GlobalValidator } from './../global-validator';
import { GAService } from './../../services/ga.service';
import { Validators, FormBuilder } from '@angular/forms';
/**
 * Signup form. Emits a userLogged event on new user signup
 */
export var SignupComponent = (function () {
    /**
    * Constructor w/ service injection
    * @param {TranslateService} private translate [description]
    * @param {TwAPIService}     private twapi     [description]
    * @param {FormBuilder}      private builder   [description]
    */
    function SignupComponent(translate, twapi, formBuilder) {
        var _this = this;
        this.translate = translate;
        this.twapi = twapi;
        this.formBuilder = formBuilder;
        this.submitAttempt = false;
        this.errors = [];
        this.filteredList = [];
        this.query = "";
        this.userLogged = new EventEmitter();
        this.signupAttempt = new EventEmitter();
        translate.setDefaultLang('en');
        translate.use('en');
        translate.get("countries").subscribe(function (result) {
            _this.countries = result;
        });
        this.signupForm = this.formBuilder.group({
            email: ["", Validators.compose([Validators.required, GlobalValidator.mailFormat])],
            emailRepeat: ["", Validators.compose([Validators.required, GlobalValidator.mailFormat])],
            password: ["", Validators.compose([Validators.required, Validators.minLength(8)])],
            passwordRepeat: ["",
                Validators.compose([
                    Validators.required,
                    Validators.minLength(8)
                ])
            ],
            lastName: "",
            firstName: "",
            country: ""
        });
    }
    /**
     * Trims the filteredList accoring to the
     * country field
     * @param {string} query [description]
     */
    SignupComponent.prototype.filter = function (query) {
        this.filteredList = this.countries.filter(function (element) {
            return element.toLowerCase().indexOf(query.toLowerCase()) > -1;
        });
    };
    /**
     * Assign the country label when selected
     * from the list
     * @param {string} item [description]
     */
    SignupComponent.prototype.select = function (item) {
        this.query = item;
        this.filteredList = [];
    };
    /**
     * submit the form
     * @param {string    }} user [description]
     */
    SignupComponent.prototype.onSubmit = function (user) {
        var _this = this;
        this.submitAttempt = true;
        this.errors = [];
        if (this.signupForm.valid &&
            user.password == user.passwordRepeat &&
            user.email == user.emailRepeat) {
            this.signupAttempt.emit(true);
            this.twapi.signup(user.email, user.password, user.firstName, user.lastName, this.query).then(function (res) {
                GAService.event('CTA', 'SIGNUP', 'SUCCESS');
                _this.userLogged.emit(res);
            }, function (error) {
                GAService.event('CTA', 'SIGNUP', 'FAIL');
                switch (error.status) {
                    case TwAPIService.HTTP_UNAUTHORIZED:
                        _this.errors.push('email-taken');
                        break;
                    default:
                        _this.errors.push('error');
                        break;
                }
            });
            this.signupAttempt.emit(false);
        }
        else {
            if (user.password != user.passwordRepeat) {
                this.errors.push('password-match');
            }
            if (user.email != user.emailRepeat) {
                this.errors.push('email-match');
            }
        }
    };
    SignupComponent.prototype.ngOnInit = function () {
    };
    SignupComponent.decorators = [
        { type: Component, args: [{
                    selector: 'watches',
                    template: ""
                },] },
    ];
    /** @nocollapse */
    SignupComponent.ctorParameters = [
        { type: TranslateService, },
        { type: TwAPIService, },
        { type: FormBuilder, },
    ];
    SignupComponent.propDecorators = {
        'userLogged': [{ type: Output },],
        'signupAttempt': [{ type: Output },],
    };
    return SignupComponent;
}());
//# sourceMappingURL=signup.component.js.map