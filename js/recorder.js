function Recorder(beatSystem) {
  var lastTime = null
  var records = []
  var lastRecord = null
  var enabled = false

  E.sub("down", function(key) {
    down(key)
  })

  E.sub("release", function(key) {
    release()
  })

  var down = function(key) {
    if (!enabled) return;
    if (!lastTime) lastTime = ctx.currentTime
    var rec = { key: key, wait: ctx.currentTime - lastTime, duration: -1 }
    lastTime = ctx.currentTime
    records.push(rec)
    lastRecord = rec
  }

  var release = function() {
    if (!enabled) return;
    if (lastRecord) lastRecord.duration = ctx.currentTime - lastTime
    lastTime = ctx.currentTime
    console.log(records)
  }

  var reset = function() {
    lastTime = null;
    records = []
    lastRecord = null
  }

  var exportt = function() {
    return _.clone(records)
  }

  return {
    down: down,
    release: release,
    export: exportt,
    reset: reset,
    on: function() {
      enabled = true
    },
    off: function() {
      enabled = false
    }
  }
}