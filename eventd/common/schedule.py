from gabcommon.redis import RedisStorageEngine
from gabcommon.log import Log
import uuid
import json

_log = Log("common.schedule")

class RedisScheduler(RedisStorageEngine):
    _timer_path_tmpl = 'timer:{}'
    _conf_path_tmpl = 'sched:{}'
    def __init__(self):
        super().__init__()
        self._handler = None

    def _gen_id(self):
        return uuid.uuid4().hex

    def _store_conf(self, id, conf):
        key = self._conf_path_tmpl.format(id)
        _log.debug('Storing event configuration for {id} at {key}'.format(
            id=id,
            key=key
        ))
        self.set(key, json.dumps(conf))

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

    def _get_conf(self, id):
        key = self._conf_path_tmpl.format(id)
        _log.debug('Getting event config for {id} from {key}'.format(
            id=id,
            key=key
        ))
        val = self.get(key)
        if val is not None:
            return json.loads(val)

    def _del_conf(self, id):
        key = self._conf_path_tmpl.format(id)
        _log.debug('Deleting event configuration for {id} at {key}'.format(
            id=id,
            key=key
        ))
        self.connection().delete(key)

    def _on_timer(self, event):
        key = event['data'].decode()
        segs = key.split(':')
        if not len(segs) == 2 or  segs[0] != 'timer':
            return
        event_id = segs[1]
        event_conf = self._get_conf(event_id)
        if self._handler is not None:
            self._handler(event_conf['payload'])
        if event_conf['repeat']:
            self._create_timer(event_conf['delay'], event_id)
        else:
            self._del_conf(event_id)

    def schedule(self, delay, payload=None, repeat=False):
        event_id = self._gen_id()
        event_conf = {
            'repeat': repeat,
            'payload': payload,
            'id': event_id,
            'delay': delay
        }
        self._store_conf(event_id, event_conf)
        self._create_timer(delay, event_id)
        _log.debug('Scheduling event {id} in {delay} secs. repeat: {repeat}'.format(
            id=event_id,
            delay=delay,
            repeat=repeat
        ))
        return event_id

    def cancel(self, id):
        _log.debug('Canceling event {}'.format(id))
        self._del_timer(id)
        self._del_conf(id)

    def start(self, handler):
        self._handler = handler
        self.connection().config_set('notify-keyspace-events', 'Ex')
        self.pubsub.subscribe(**{'__keyevent@0__:expired': self._on_timer})
        self.listen()

    @property
    def events(self):
        self.connection().config_set('notify-keyspace-events', 'Ex')
        self.pubsub.subscribe('__keyevent@0__:expired')
        _log.debug('Watching timer expiries...')
        for event in self.pubsub.listen():
            _log.debug('Got expiry for key %s'%event['data'].decode('utf-8'))
            key = event['data'].decode()
            segs = key.split(':')
            if len(segs) == 2 and segs[0] == 'timer':
                event_id = segs[1]
                _log.debug('Event %s triggered'%event_id)
                event_conf = self._get_conf(event_id)
                if event_conf['repeat']:
                    _log.debug('Event {id} set to repeat, rescheduling in {delay} secs'.format(
                        id=event_id,
                        delay=event_conf['delay']
                    ))
                    self._create_timer(event_conf['delay'], event_id)
                else:
                    self._del_conf(event_id)
                yield event_conf['payload']
