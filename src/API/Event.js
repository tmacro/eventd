const ApiController = require('./controller');

const controller = new ApiController('Event');

module.exports = controller.buildMap();