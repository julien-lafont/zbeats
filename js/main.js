var app = (function() {

  var beatSystem = new BeatSystem()

  var init = function() {
    $(".beat").each(function() {
      var $this = $(this)
      var key = $this.data("key")
      var frequency = $this.data("frequency")
      beatSystem.register(key, new BeatBuzzer(beatSystem, $this, key, frequency));
    })
  }

  return {
    init: function() {
      init()
    }
  }
}());

function SimpleAudioManager() {

  var ctx = new (window.AudioContext || window.webkitAudioContext)();

  var vco = ctx.createOscillator();
  vco.type = vco.SINE;
  vco.frequency.value = this.frequency;
  vco.start(0);

  var vca = ctx.createGain();
  vca.gain.value = 0;

  vco.connect(vca);
  vca.connect(ctx.destination);

  return {
    setFrequency: function(frequency) {
      vco.frequency.value = frequency
    },
    play: function() {
      vca.gain.value = 1;
    },
    stop: function() {
      vca.gain.value = 0;
    }
  }

}

function BeatSystem() {

  var buzzers = {}
  var activeBuzzer = null
  var recorder = new Recorder()
  var metronome = new Metronome()

  return {
    register: function(key, beat) {
      buzzers[key] = beat
    },
    down: function(key) {
      if (activeBuzzer) {
        activeBuzzer.stop()
      }
      activeBuzzer = buzzers[key]
      activeBuzzer.start()

    },
    release: function(key) {
      if (activeBuzzer && activeBuzzer.key == key) {
        activeBuzzer.stop()
        activeBuzzer = null
      }
    }
  }

}

function Metronome() {
  var audioManager = new SimpleAudioManager()
  audioManager.setFrequency(220)
  setInterval(function() {
    audioManager.play()
    setTimeout(function() { audioManager.stop()}, 200)
  }, 400)
}

function BeatBuzzer(beatSystem, $elem, key, frequency) {

  var audioManager = new SimpleAudioManager()

  $elem.on('click', function() { 
    beatSystem.down(key)
    setTimeout(function() { beatSystem.release(key) }, 200)
  })

  $(document)
    .on('keydown', null, key, function() { beatSystem.down(key) })
    .on('keyup', null, key, function() { beatSystem.release(key) })

  return {
    start: function() {
      audioManager.setFrequency(frequency)
      audioManager.play()
    },
    stop: function() {
      audioManager.stop()
    },
    key: key
  }
}

function Recorder() {

}

$(function() {
  app.init()
})