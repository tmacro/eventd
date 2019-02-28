from gabcommon.redis import RedisStorageEngine
from gabcommon.log import Log
from .types import Event
import uuid
import json

_log = Log("common.schedule")

class RedisScheduler(RedisStorageEngine):
    _timer_path_tmpl = 'timer:{}'
    _conf_path_tmpl = 'sched:{}'

    def _gen_id(self):
        return uuid.uuid4().hex

    def _store_event(self, event):
        key = self._conf_path_tmpl.format(event.id)
        _log.debug('Storing event configuration for {id} at {key}'.format(
            id=event.id,
            key=key
        ))
        self.set(key, event.to_json())

    def _get_event(self, id):
        key = self._conf_path_tmpl.format(id)
        _log.debug('Getting event config for {id} from {key}'.format(
            id=id,
            key=key
        ))
        val = self.get(key)
        if val is not None:
            return Event.from_json(val)

    def _del_event(self, id):
        key = self._conf_path_tmpl.format(id)
        _log.debug('Deleting event configuration for {id} at {key}'.format(
            id=id,
            key=key
        ))
        self.connection().delete(key)

    def _create_timer(self, delay, id):
        key = self._timer_path_tmpl.format(id)
        _log.debug('Creating timer for {id} at {key}'.format(
            id=id,
            key=key
        ))
        self.set(key, '', ttl=delay)

    def _del_timer(self, id):
        key = self._timer_path_tmpl.format(id)
        _log.debug('Deleting timer {id} at {key}'.format(
            id=id,
            key=key
        ))
        self.connection().delete(key)


    def schedule(self, event):
        self._store_event(event)
        self._create_timer(event.delay, event.id)
        _log.debug('Scheduling event {id} in {delay} secs. repeat: {repeat}'.format(
            id=event.id,
            delay=event.delay,
            repeat=event.repeat
        ))
        return event.id

    def cancel(self, id):
        _log.debug('Canceling event {}'.format(id))
        self._del_timer(id)
        self._del_event(id)

    @property
    def events(self):
        self.connection().config_set('notify-keyspace-events', 'Ex')
        self.pubsub.subscribe('__keyevent@0__:expired')
        _log.debug('Watching timer expiries...')
        for expiry in self.pubsub.listen():
            _log.debug('Got expiry for key %s'%expiry['data'].decode('utf-8'))
            key = expiry['data'].decode()
            segs = key.split(':')
            if len(segs) == 2 and segs[0] == 'timer':
                event = self._get_event(segs[1])
                _log.debug('Event %s triggered'%event.id)
                if event.repeat:
                    _log.debug('Event {id} set to repeat, rescheduling in {delay} secs'.format(
                        id=event.id,
                        delay=event.delay
                    ))
                    self._create_timer(event.delay, event.id)
                else:
                    self._del_event(event.id)
                yield event
