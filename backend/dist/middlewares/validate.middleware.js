"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, _res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validate = validate;
//# sourceMappingURL=validate.middleware.js.map