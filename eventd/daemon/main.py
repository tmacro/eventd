from ..common.schedule import RedisScheduler
from gabcommon.redis import RedisStorageEngine
import requests


class EventEmitter(RedisStorageEngine):
    def _emit_webhook(self, url=None, data=None, method='POST'):
        kwargs = {}
        if data:
            kwargs['json'] = data
        requests.request(method.upper(), url, **kwargs)

    def _emit_redis(self, channel=None, data=None):
        self.publish(channel, data if data is not None else '')

    def emit(self, conf):
        print('Got event %s'%str(conf))
        if 'webhook' in conf:
            self._emit_webhook(**conf['webhook'])
        else:
            self._emit_redis(**conf)

event_emitter = EventEmitter()
scheduler = RedisScheduler()

scheduler.start(event_emitter.emit)
