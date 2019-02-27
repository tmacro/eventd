# Eventd


# API Methods

## /eventd/v1/register

## /eventd/v1/cancel


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
