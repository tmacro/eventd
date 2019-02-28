import json
import uuid

class Event:
    def __init__(
        self,
        type=None,
        id=None,
        data=None,
        channel=None,
        url=None,
        method=None,
        delay=None,
        repeat=None
    ):
        self.type = type
        self.id = id if id is not None else uuid.uuid4().hex
        self.data = data if data is not None else ''
        self.channel = channel
        self.url = url
        self.method = method if method is not None else 'POST'
        self.delay = delay
        self.repeat = repeat if repeat is not None else False
        if channel is None and url is None:
            self.channel = 'sched:%s'%self.id

    def to_json(self):
        data = {
            k:v for k, v in dict(
                type=self.type,
                id=self.id,
                data=self.data,
                channel=self.channel,
                url=self.url,
                method=self.method,
                delay=self.delay,
                repeat=self.repeat
            ).items() if v is not None
        }
        return json.dumps(data)

    @classmethod
    def from_json(cls, raw_data):
        data = json.loads(raw_data)
        event_type = data.pop('type')
        return cls(event_type, **data)
