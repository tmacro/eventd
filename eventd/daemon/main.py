from ..common.schedule import RedisScheduler
from gabcommon.redis import RedisStorageEngine
from gabcommon.log import Log
import requests

_log = Log('emitter')

class EventEmitter(RedisStorageEngine):
    def _emit_webhook(self, url=None, data=None, method='POST'):
        kwargs = {}
        if data:
            kwargs['json'] = data
        requests.request(method.upper(), url, **kwargs)

    def _emit_redis(self, channel=None, data=None):
        self.publish(channel, data if data is not None else '')

    def emit(self, conf):
        _log.debug('Got event %s'%str(conf))
        try:
            if 'webhook' in conf:
                self._emit_webhook(**conf['webhook'], data=conf.get('payload'))
            else:
                self._emit_redis(**conf)
        except Exception:
            pass


def watch_events():
    event_emitter = EventEmitter()
    scheduler = RedisScheduler()
    for event in scheduler.events:
        event_emitter.emit(event)
