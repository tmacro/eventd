import logging
from .handlers import BaseEventSchedule
from .schema import EVENT_SCHEMA
import jsonschema
from jsonschema.exceptions import ValidationError
import falcon

class RIPTerryPratchett:
	def process_response(self, req, resp, resource, req_succeeded):
		resp.set_header('X-Clacks-Overhead', 'His name is in the code, in the wind in the rigging and the shutters. GNU Terry Pratchett')

class SchemaValidator:
    def process_resource(self, req, resp, resource, params):
        if isinstance(resource, BaseEventSchedule):
            if req.method == 'POST' or req.method == 'PATCH':
                try:
                    jsonschema.validate(req.media, EVENT_SCHEMA)
                except ValidationError as err:
                    raise falcon.HTTPBadRequest(
                        description=err.message
                    )
