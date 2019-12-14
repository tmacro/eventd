async function errorMiddleware(err, req, res) {
    // Check for an empty error added by oas-tools
    if (Object.keys(err).length === 0) {
        return next();
    }
    req.logger.error('error', { error: err });
    if (err.code === undefined) {
        // eslint-disable-next-line no-param-reassign
        err.code = 500;
    }
    res.status(err.code).send({
        error: {
            code: err.code.toString(),
            message: err.description,
        },
    });
}

function initErrorMiddleware(app, callback) {
    app.use(errorMiddleware);
    return callback();
}

module.exports = {
    errorMiddleware,
    initErrorMiddleware,
};