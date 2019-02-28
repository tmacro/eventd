# Eventd


# API Methods

## Create Event

> POST /eventd/v1/events

### Request
```
{
    "delay": 5, # How many seconds to wait before triggering
    "channel": null,
    "url": "https://example.com", # Optional, specify a webhook to call on event
    "method": "POST" # Optional, specify the HTTP method
    "data": null, # Optional, include a payload for webhook/pubsub
    "repeat": false  # Whether to repeat the event
}
```
### Response
```
{
    "id": "53daf8ae20d94a0c95f34c43427ad91f",
    "ok": true,
    "cancel": "/eventd/v1/cancel/53daf8ae20d94a0c95f34c43427ad91f",
    "update": "/eventd/v1/update/53daf8ae20d94a0c95f34c43427ad91f",
    "error": null
}
```

## Delete Event

> DELETE /eventd/v1/events/<id>

### Request
To delete a event call a HTTP DELETE on the url

### Response
```
{
    "id": "53daf8ae20d94a0c95f34c43427ad91f",
    "ok": true,
    "error": null
}
```

## Update Event

> PATCH /eventd/v1/event/<id>

### Request
```
{
    "delay": 5, # How many seconds to wait before triggering
    "webhook": { # Optional, specify a webhook to call on event
        "url": "https://example.com",
        "method": "POST" # Optional, specify the HTTP method
    },
    "payload": null, # Optional, include a text http payload for webhook/pubsub
    "repeat": false  # Whether to repeat the event
}
```
### Response
```
{
    "id": "53daf8ae20d94a0c95f34c43427ad91f",
    "ok": true,
    "cancel": "/eventd/v1/cancel/53daf8ae20d94a0c95f34c43427ad91f",
    "update": "/eventd/v1/update/53daf8ae20d94a0c95f34c43427ad91f",
    "error": null
}
```


## Redis Key layout

### Events

`event:slack:<event_type>`
`event:sched:<uuid>`

### Internal Keyspace

Scheduled events are stored in `sched:<uuid>` with their respective timer being `timer:<uudid>`

Eventd leverages keyspace notifications to implement internal notifications.
When a scheduled event is created, a macthing timer is created with a TTL of the delay until the event.
Upon seeing the timer key expire, eventd then looks up the event config in the `sched` key and takes appropriate action.
In the case of repeating events the timer key is then recreated.
