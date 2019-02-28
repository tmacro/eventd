import multiprocessing
from gabcommon.log import Log
from gabcommon.redis import RedisStorageEngine
from queue import Empty as QueueEmpty
import requests

_log = Log('event')

class EventEmitter:
    def __init__(self):
        self._log = Log('event.emitter')
        self._redis = RedisStorageEngine()

    def _emit_redis(self, event):
        self._log.debug('Emitting redis event on channel %s'%event.channel)
        self._redis.publish(event.channel, event.data)

    def _emit_webhook(self, event):
        self._log.debug("Emitting webhook event to %s %s"%(event.method, event.url))
        requests.request(event.method, event.url, data=event.data)

    def emit(self, event):
        if event.type == 'redis':
            return self._emit_redis(event)
        elif event.type == 'webhook':
            return self._emit_webhook(event)
        else:
            self._log.error('Unknown event type "%s"'%event.type)

def PoolWorker(queue):
    emitter = EventEmitter()
    while True:
        try:
            event = queue.get(True, 1)
        except QueueEmpty:
            pass
        else:
            emitter.emit(event)

class EmitterPool:
    def __init__(self):
        self._queue = multiprocessing.Queue()
        self._worker_pool = multiprocessing.Pool(
            None,
            PoolWorker,
            (self._queue,)
        )

    def emit(self, event):
        self._queue.put(event)
