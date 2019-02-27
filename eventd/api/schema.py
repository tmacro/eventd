

EVENT_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "delay": {
            "type": "integer",
            "exclusiveMinimum": 0
        },
        "webhook": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string"
                },
                "method": {
                    "type": "string",
                    "enum": ["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"],
                    "default": "GET"
                }
            },
            "required": ["url"]
        },
        "payload": {
            "type": ["object", "null"],
            "default": None
        },
        "repeat": {
            "type": "boolean",
            "default": False
        }
    },
    "required": ["delay"]
}
