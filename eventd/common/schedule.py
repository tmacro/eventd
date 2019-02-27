from gabcommon.redis import RedisStorageEngine
import uuid
import json

class RedisScheduler(RedisStorageEngine):
    _timer_path_tmpl = 'timer:{}'
    _conf_path_tmpl = 'sched:{}'
    def __init__(self):
        super().__init__()
        self._handler = None

    def _gen_id(self):
        return uuid.uuid4().hex

    def _store_conf(self, id, conf):
        self.set(self._conf_path_tmpl.format(id), json.dumps(conf))

    def _create_timer(self, delay, id):
        self.set(self._timer_path_tmpl.format(id), '', ttl=delay)

    def _del_timer(self, id):
        self.connection().delete(self._timer_path_tmpl.format(id))

    def _get_conf(self, id):
        val = self.get(self._conf_path_tmpl.format(id))
        if val is not None:
            return json.loads(val)

    def _del_conf(self, id):
        self.connection().delete(self._conf_path_tmpl.format(id))

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
        return event_id

    def cancel(self, id):
        self._del_timer(id)
        self._del_conf(id)

    def start(self, handler):
        self._handler = handler
        self.connection().config_set('notify-keyspace-events', 'Ex')
        self.pubsub.subscribe(**{'__keyevent@0__:expired': self._on_timer})
        self.listen()
