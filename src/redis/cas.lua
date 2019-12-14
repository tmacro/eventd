local current_value = ARGV[1]
local wanted_value = ARGV[2]
local event_version_key = KEYS[1]

local actual_value = redis.call("GET", event_version_key)
if actual_value == current_value  then
    redis.call("SET", event_version_key, wanted_value)
    return wanted_value
end
return false