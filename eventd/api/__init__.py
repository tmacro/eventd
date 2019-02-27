from gabcommon.log import setupLogging
from gabcommon.conf import config

__version__ = '0.0.0'

setupLogging('eventd.api', __version__, **config.logging._asdict())
