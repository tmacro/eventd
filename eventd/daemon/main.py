from ..common.schedule import RedisScheduler
from .event import EmitterPool
from gabcommon.log import Log



def watch_events():
    event_emitter = EmitterPool()
    scheduler = RedisScheduler()
    for event in scheduler.events:
        event_emitter.emit(event)
