function BeatSystem() {

  var buzzers = {}
  var activeBuzzer = null
  var recorder = new Recorder()
  var replayer = new Replayer(buzzers)
  var mustRecord = false
  var sequenceTemoin = null

  var down = function(key) {
    if (activeBuzzer && activeBuzzer.key == key) return;
    if (activeBuzzer && activeBuzzer.key != key) {
        release(activeBuzzer.key)
    }
    activeBuzzer = buzzers[key]
    activeBuzzer.start()
    E.pub("down", [key])
  }

  var release = function(key) {
    if (activeBuzzer) {
      activeBuzzer.stop()
      activeBuzzer = null
      E.pub("release", [key])
    }
  }

  var replay = function() {
    var seq = recorder.export()
    replayer.run(seq)
  }

  var startRecord = function() {
    recorder.reset()
    recorder.on()
  }

  var stopRecord = function() {
    recorder.off()
    sequenceTemoin = recorder.export()
  }

  var launchGame = function() {
    if (!sequenceTemoin) {
      alert("Record the rythm before playing !")
      return;
    }

    var nbBeats = sequenceTemoin.length
    alert("You have to play " + nbBeats + " beats")

    recorder.reset()
    recorder.on()

    E.sub("release", function(key) {
      if (--nbBeats == 0) {
        recorder.off()
        var scoring = new Scoring(sequenceTemoin, recorder.export())
        alert("Score : " + scoring.level + " (différence: " + scoring.time + "s)");
      }
    })
  }

  return {
    register: function(key, beat) {
      buzzers[key] = beat
    },
    down: down,
    release: release,
    replay: replay,
    startRecord: startRecord,
    stopRecord: stopRecord,
    launchGame: launchGame
  }

}

function BeatBuzzer(beatSystem, $elem, key, frequency) {

  var audioManager = new SimpleAudioManager()

  $elem.on('touchstart', function() { beatSystem.down(key) })
  $elem.on('touchend touchcancel', function() { beatSystem.release(key) })

  $(document)
    .on('keydown', null, key, function() { beatSystem.down(key) })
    .on('keyup', null, key, function() { beatSystem.release(key) })

  E.sub("down", function(ekey) { if (ekey == key) start() })
  E.sub("release", function(ekey) { if (ekey == key) stop() })

  var start = function() {
    audioManager.setFrequency(frequency)
    audioManager.play()
    $elem.addClass("active")
  }

  var stop = function() {
    audioManager.stop()
    $elem.removeClass("active")
  }

  return {
    start: start,
    stop: stop,
    key: key
  }
}