import logging
from .handlers import BaseEventSchedule
from .schema import EVENT_SCHEMA
import jsonschema

class RIPTerryPratchett:
	def process_response(self, req, resp, resource, req_succeeded):
		resp.set_header('X-Clacks-Overhead', 'His name is in the code, in the wind in the rigging and the shutters. GNU Terry Pratchett')

class SchemaValidator:
    def process_resource(self, req, resp, resource, params):
        if isinstance(resource, BaseEventSchedule):
            if req.method == 'POST' or req.method == 'PATCH':
                if not jsonschema.validate(req.media, EVENT_SCHEMA):
                    print('failed validation')
