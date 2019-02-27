from gabcommon import log
from gabcommon.conf import config

__version__ = '0.0.0'

log.setupLogging('eventd.daemon', __version__, **config.logging._asdict())
