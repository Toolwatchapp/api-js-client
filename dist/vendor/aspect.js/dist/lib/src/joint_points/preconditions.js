"use strict";
var MethodPrecondition = (function () {
    function MethodPrecondition(selector) {
        this.selector = selector;
    }
    MethodPrecondition.prototype.assert = function (_a) {
        var className = _a.className, methodName = _a.methodName;
        return this.selector.classNamePattern.test(className) &&
            this.selector.methodNamePattern.test(methodName);
    };
    return MethodPrecondition;
}());
exports.MethodPrecondition = MethodPrecondition;
var MemberPrecondition = (function () {
    function MemberPrecondition(selector) {
        this.selector = selector;
    }
    MemberPrecondition.prototype.assert = function (_a) {
        var className = _a.className, fieldName = _a.fieldName;
        return this.selector.classNamePattern.test(className) &&
            this.selector.fieldNamePattern.test(fieldName);
    };
    return MemberPrecondition;
}());
exports.MemberPrecondition = MemberPrecondition;
//# sourceMappingURL=preconditions.js.map