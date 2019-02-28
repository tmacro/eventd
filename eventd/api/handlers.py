import falcon
import logging
import pprint
import json
from ..common.schedule import RedisScheduler
from ..common.types import Event

class URLVerificationHandler:
	def on_post(self, req, resp):
		resp.body = req.media.get('challenge')
		resp.status = falcon.HTTP_200

class SlackEventHandler:
	def __init__(self, redis):
		self.redis = redis

	def on_post(self, req, resp):
		self.redis.publish_event(req.media)
		resp.status = falcon.HTTP_200

class HealthCheck:
	def on_get(self, req, resp):
		resp.status = falcon.HTTP_200

class BaseEventSchedule:
    def __init__(self, scheduler):
        self._sched = scheduler

class EventCreate(BaseEventSchedule):
    def on_post(self, req, resp): # Create a new timer
        event_data = req.media.copy()
        event_data['type'] = 'webhook' if 'url' in req.media else 'redis'
        event_data['repeat'] = req.media.get('repeat', False)
        event = Event(**event_data)
        self._sched.schedule(event)
        resp_body = {
            "id": event.id,
            "ok": True,
            "cancel": "/eventd/v1/events/%s"%event.id,
            "update": "/eventd/v1/events/%s"%event.id,
            "error": None
        }
        resp.body = json.dumps(resp_body)
        resp.status = falcon.HTTP_200


class EventModify(BaseEventSchedule):
    def on_delete(self, req, resp, event_id):
        pass
    def on_patch(self, reqp, resp, event_id):
        pass
