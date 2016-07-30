"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var joint_point_1 = require('../core/joint_point');
var pointcut_1 = require('../core/pointcut');
var aspect_1 = require('../core/aspect');
var preconditions_1 = require('./preconditions');
var AccessorJointPoint = (function (_super) {
    __extends(AccessorJointPoint, _super);
    function AccessorJointPoint(precondition, type) {
        _super.call(this, precondition);
        this.type = type;
    }
    AccessorJointPoint.prototype.getTarget = function (fn) {
        return fn.prototype;
    };
    AccessorJointPoint.prototype.woveTarget = function (proto, key, advice, woveMetadata) {
        var className = proto.constructor.name;
        var self = this;
        var descriptor = Object.getOwnPropertyDescriptor(proto, key);
        if (typeof descriptor[this.type] === 'function') {
            var bak_1 = descriptor[this.type];
            descriptor[this.type] = function () {
                var metadata = self.getMetadata(className, key, arguments, this, woveMetadata);
                return advice.wove(bak_1, metadata);
            };
            descriptor[this.type]['__woven__'] = true;
            Object.defineProperty(proto, key, descriptor);
        }
    };
    AccessorJointPoint.prototype.match = function (target) {
        var _this = this;
        var name = target.name;
        var keys = Object.getOwnPropertyNames(target.prototype);
        var res = keys.map(function (key) {
            var descriptor = Object.getOwnPropertyDescriptor(target.prototype, key);
            if (_this.precondition.assert({ className: name, fieldName: key }) &&
                typeof descriptor[_this.type] === 'function') {
                return key;
            }
            return false;
        }).filter(function (val) { return !!val; });
        return res;
    };
    return AccessorJointPoint;
}(joint_point_1.JointPoint));
exports.AccessorJointPoint = AccessorJointPoint;
function makeFieldGetAdviceDecorator(constr) {
    return function () {
        var selectors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            selectors[_i - 0] = arguments[_i];
        }
        return function (target, prop, descriptor) {
            var jointpoints = selectors.map(function (selector) {
                return new AccessorJointPoint(new preconditions_1.MemberPrecondition(selector), 'get');
            });
            var pointcut = new pointcut_1.Pointcut();
            pointcut.advice = new constr(target, descriptor.value);
            pointcut.jointPoints = jointpoints;
            var aspectName = target.constructor.name;
            var aspect = aspect_1.AspectRegistry[aspectName] || new aspect_1.Aspect();
            aspect.pointcuts.push(pointcut);
            aspect_1.AspectRegistry[aspectName] = aspect;
            return target;
        };
    };
}
exports.makeFieldGetAdviceDecorator = makeFieldGetAdviceDecorator;
function makeFieldSetAdviceDecorator(constr) {
    return function () {
        var selectors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            selectors[_i - 0] = arguments[_i];
        }
        return function (target, prop, descriptor) {
            var jointpoints = selectors.map(function (selector) {
                return new AccessorJointPoint(new preconditions_1.MemberPrecondition(selector), 'set');
            });
            var pointcut = new pointcut_1.Pointcut();
            pointcut.advice = new constr(target, descriptor.value);
            pointcut.jointPoints = jointpoints;
            var aspectName = target.constructor.name;
            var aspect = aspect_1.AspectRegistry[aspectName] || new aspect_1.Aspect();
            aspect.pointcuts.push(pointcut);
            aspect_1.AspectRegistry[aspectName] = aspect;
            return target;
        };
    };
}
exports.makeFieldSetAdviceDecorator = makeFieldSetAdviceDecorator;
//# sourceMappingURL=accessor_use.js.map