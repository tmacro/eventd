const apiErrors = require('./errors.json');

class ApiError extends Error {
    constructor(type, code, desc) {
        super(type);
        this.code = code;
        this.description = desc;
        this[type] = true;
    }

    customizeDescription(description) {
        return new ApiError(this.message, this.code, description);
    }
}

function errorsGen() {
    return Object.keys(apiErrors)
        .reduce((errors, name) => {
            errors[name] = new ApiError(name, apiErrors[name].code,
                apiErrors[name].description);
            return errors;
        }, {});
}

module.exports = errorsGen();