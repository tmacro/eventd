import falcon

from ..common.schedule import RedisScheduler
from .handlers import EventCreate, HealthCheck
from .middleware import RIPTerryPratchett, SchemaValidator

# class ThingsResource(object):
#     def on_get(self, req, resp):
#         """Handles GET requests"""
#         resp.status = falcon.HTTP_200  # This is the default status
#         resp.body = ('\nTwo things awe me most, the starry sky '
#                      'above me and the moral law within me.\n'
#                      '\n'
#                      '    ~ Immanuel Kant\n\n')

application = app = falcon.API(middleware=[
    SchemaValidator(),
	RIPTerryPratchett()
])

app.add_route('/eventd/v1/events', EventCreate(RedisScheduler()))
app.add_route('/_/meta/healthcheck', HealthCheck())
