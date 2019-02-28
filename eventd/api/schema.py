

EVENT_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "propertyNames": {
        "enum": ["delay", "repeat", "url", "data", "channel", "method"]
    },
    "properties": {
        "delay": {
            "type": "integer",
            "exclusiveMinimum": 0
        },
        "repeat": {
            "type": "boolean",
            "default": False
        },
        "url": {
            "type": "string"
        },
        "data": {
        },
        "channel": {
            "type": "string"
        },
        "method": {
            "type": "string",
            "enum": ["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"],
            "default": "GET"
        }
    },
    "required": ["delay"]
}
