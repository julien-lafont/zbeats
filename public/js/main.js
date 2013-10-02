var ctx = new (window.AudioContext || window.webkitAudioContext)();

// pub/sub system
var E = (function(_){return{pub:function(a,b,c,d){for(d=-1,c=[].concat(_[a]);c[++d];)c[d](b)},sub:function(a,b){(_[a]||(_[a]=[])).push(b)}}})({});

var config = {
  volume: 0.05
}

var app = (function() {

  var beatSystem = new BeatSystem()
  
  var init = function() {
    $(".beat").each(function() {
      var $elem = $(this)
      var key = $elem.data("key")
      var frequency = $elem.data("frequency")
      beatSystem.register(key, new BeatBuzzer(beatSystem, $elem, key, frequency));
    })

    // ------- TEST -----------
    $("#replay").on("click", function() {
      beatSystem.replay()
    })

    $("#record-start").on('click', function() {
      beatSystem.startRecord();
      $("#record-stop").show()
      $("#record-start").hide()
      $("#try").hide()
      $("#replay").hide()
    })

    $("#record-stop").on('click', function() {
      beatSystem.stopRecord();
      $("#record-stop").hide()
      $("#try").show()
      $("#replay").show()
    })

    $("#try").on('click', function() {
      beatSystem.launchGame();
    })

    E.sub("startgame", function() {
      $("#replay").hide()
      $("#try").hide()
    })
    E.sub("endgame", function() {
      $("#record-start").show()
    })
  }

  return {
    init: init
  }
}());


$(function() {
  app.init()
})


/*

function Metronome() {
  var audioManager = new SimpleAudioManager()
  var tick = 0;
  var metronomeInterv = setInterval(function() {
    audioManager.setFrequency((tick%4 == 0) ? 280 : 220)
    audioManager.play()
    setTimeout(function() { audioManager.stop()}, 200)
    tick ++
    if (tick == 8) clear(metronomeInterv)
  }, 400)
}

*/

/*function clamp (x, min, max) {
  return Math.min(Math.max(x, min), max);
};

function smoothstep (min, max, x) {
  x = clamp((x-min)/(max-min), 0.0, 1.0);
  return x*x*(3-2*x);
};

function mix (x, y, a) {
  return x*(1-a) + y*a;
};

var NOTES = (function () {
  var notes = {};
  var toneSymbols = "CcDdEFfGgAaB";
  function noteToFrequency (note) {
    return Math.pow(2, (note-69)/12)*440;
  };
  for (var octave = 0; octave < 8; ++octave) {
    for (var t = 0; t < 12; ++t) {
      notes[toneSymbols[t]+octave] = noteToFrequency(octave * 12 + t);
    }
  }
  return notes;
}());

var vars = {
  lvl: 1,
  time: 0,
  dubstepAction: false,
  useraction: -Infinity,
  kick: -Infinity,
  kickSpeed: 0.2,
  bpm: 50,
  successState: 0.0,
  dubphase: false,
  dubloading: 0,
  pulseOpenFrom: 0,
  pulseOpenTo: 0
};

var audio = (function() {
  var ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();

  var ticksPerBeat = 4;
  var scheduleAheadTime = 0.1;
  var lastTickTime = -60 / (ticksPerBeat * vars.bpm);
  var currentTick = -1;

  function createGain () {
    return ctx.createGain();
  }
  function createOscillator () {
    return ctx.createOscillator();
  }

  function cancelScheduledValues (node, t) {
    node.cancelScheduledValues(t);
  }
  function setValueAtTime (node, value, time) {
    node.setValueAtTime(value, time);
  }
  function linearRampToValueAtTime (node, value, time) {
    node.linearRampToValueAtTime(value, time);
  }
 
  function startNode (node, time, offset, duration) {
    time = time || ctx.currentTime;
    offset = offset || 0;
    if (duration)
      node.start(time, offset, duration);
    else
      node.start(time, offset);
  }

  function envelope (gainNode, time, volume, duration, a, d, s, r) {
    var gain = gainNode.gain;
    cancelScheduledValues(gain, 0);
    setValueAtTime(gain, 0, time);
    linearRampToValueAtTime(gain, volume, time + a);
    linearRampToValueAtTime(gain, volume * s, time + a + d);
    setValueAtTime(gain, volume * s, time + a + d + duration);
    linearRampToValueAtTime(gain, 0, time + a + d + duration + r);
  }

  function OscGain (t) {
    this.osc = createOscillator();
    if (t) this.osc.type = t;
    this.out = this.gain = createGain();
    this.osc.connect(this.gain);
  }
  OscGain.prototype = {
    start: function (time, duration) {
      startNode(this.osc, time, 0, duration);
    }
  };

  function FM () {
    OscGain.call(this);
    this.mod = new OscGain();
    this.mod.out.connect(this.osc.frequency);
  }
  FM.prototype = {
    start: function (time, duration) {
      startNode(this.osc, time, 0, duration);
      this.mod.start(time, duration);
    }
  };

  function Repeater (d, r, maxDelay) {
    var out = createGain();
    var delay = ctx.createDelay(maxDelay||2);
    delay.delayTime.value = d || 0.1;
    out.connect(delay);
    var repeatGain = createGain();
    repeatGain.gain.value = r || 0;
    delay.connect(repeatGain);
    repeatGain.connect(out);
    this.gain = out;
    this.delay = delay;
    this.repeater = repeatGain;
    this.inp = this.out = out;
  }

  function CrazyWob () {
    // array of [ AudioParam, multiplicator ]
    var _fw = this._fw = [];
    var _sw = this._sw = [];
    var _vw = this._vw = [];
    function fwatch (param, mult) {
      _fw.push([param,mult]);
    }
    function swatch (param, mult) {
      _sw.push([param,mult]);
    }
    function vwatch (param, mult) {
      _vw.push([param,mult]);
    }

    var out = createGain();

    var volume = createGain();
    volume.gain.value = 0;
    vwatch(volume.gain, 1);

    var osc = new OscGain("triangle");
    osc.gain.gain.value = 0;
    vwatch(osc.gain.gain, 1);

    fwatch(osc.osc.frequency, 1);

    var mod2 = new OscGain("square");
    fwatch(mod2.osc.frequency, 2.03);
    fwatch(mod2.gain.gain, 1/3);
    var mod2bis = new OscGain("sawtooth");
    fwatch(mod2bis.osc.frequency, 0.501);
    fwatch(mod2bis.gain.gain, 1);
    var mod = new OscGain("sine");
    fwatch(mod.osc.frequency, 0.251);
    fwatch(mod.gain.gain, 1);

    mod2.osc.detune.value = -7;
    mod2bis.osc.detune.value = -10;
    mod.osc.detune.value = 3;

    mod2.out.connect(mod2bis.gain.gain);
    mod2bis.out.connect(mod.gain.gain);
    mod.out.connect(osc.osc.frequency);

    var filter = ctx.createBiquadFilter();
    filter.Q.value = 2;
    filter.frequency.value = 500;

    var filterLFO = new OscGain("sine");
    swatch(filterLFO.osc.frequency, 1);
    filterLFO.out.connect(filter.frequency);

    var bp = ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.Q.value = 3;
    bp.frequency.value = 3000;

    var bpMod = new OscGain("sawtooth");
    bpMod.gain.gain.value = 3000;
    swatch(bpMod.osc.frequency, 1/2);
    bpMod.out.connect(bp.frequency);

    osc.out.connect(volume);
    volume.connect(bp);
    volume.connect(filter);

    var volumeLFO = new OscGain("sine");
    swatch(volumeLFO.osc.frequency, 1);
    volumeLFO.out.connect(volume.gain);

    bp.connect(out);
    filter.connect(out);

    osc.start(0);
    mod2.start(0);
    mod2bis.start(0);
    mod.start(0);
    filterLFO.start(0);
    bpMod.start(0);
    volumeLFO.start(0);

    this.volume = volume;
    this.osc = osc;
    this.out = out;
  }

  CrazyWob.prototype = {
    setVolume: function (t, v) {
      this._vw.forEach(function (w) {
        cancelScheduledValues(w[0], 0);
        setValueAtTime(w[0], v*w[1], t);
      });
    },
    setSpeed: function (t, s) {
      this._sw.forEach(function (w) {
        cancelScheduledValues(w[0], 0);
        setValueAtTime(w[0], s*w[1], t);
      });
    },
    setNoteFreq: function (t, f) {
      this._fw.forEach(function (w) {
        cancelScheduledValues(w[0], 0);
        setValueAtTime(w[0], f*w[1], t);
      });
    }
  };

  function Reverb (time) { // TODO
    var input = createGain();
    var output = createGain();
    var drygain = createGain();
    var wetgain = createGain();

    var verb = ctx.createConvolver();
    verb.connect(wetgain);

    input.connect(verb);
    input.connect(drygain);

    drygain.connect(output);
    wetgain.connect(output);
    
    function buildImpulse (time) {
          // FIXME: need the audio context to rebuild the buffer.
       var rate = ctx.sampleRate,
          length = rate * time,
          reverse = false,
          decay = 2,
          impulse = ctx.createBuffer(2, length, rate),
          impulseL = impulse.getChannelData(0),
          impulseR = impulse.getChannelData(1);
      for (var i = 0; i < length; i++) {
        var n = reverse ? length - i : i;
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
      }
      verb.buffer = impulse;
    }

    this.dry = drygain;
    this.wet = wetgain;
    this.inp = input;
    this.out = output;

    buildImpulse(time||1);
    this.mix(0);
  };

  Reverb.prototype = {
    mix: function (m) {
      this.wet.gain.value = m;
      this.dry.gain.value = 1-m;
    }
  };

  function Kicker (freq, attack, duration, fall) {
    OscGain.call(this);
    this.gain.gain.value = 0;
    this.osc.frequency.value = freq;
    this.freq = freq || 50;
    this.fall = fall || 0;
    this.attack = attack || 0;
    this.duration = duration || 0;
    this.volume = 1;
  }

  Kicker.prototype = {
    start: function (time, duration) {
      startNode(this.osc, time, 0, duration);
    },
    trigger: function (time) {
      var a = this.attack, d = this.attack + 0.06, s = 0.8, r = 0.1;
      this.start(time, this.duration + 1);
      envelope(this.gain, time, this.volume, this.duration, a, d, s, r);
      setValueAtTime(this.osc.frequency, this.freq, time);
      linearRampToValueAtTime(this.osc.frequency, 0, time + this.fall);
    }
  };

  function Snare (volume, freqFrom, freqTo) {
    var noise = new Noise();
    noise.filter.type = "lowpass";
    noise.filter.Q.value = 5;
    noise.gain.gain.value = 0;
    this.noise = noise;
    this.out = noise.out;
    this.volume = volume || 1;
    this.freqFrom = freqFrom || 800;
    this.freqTo = freqTo || 1000;
    this.release = 0.3;
  }

  Snare.prototype = {
    trigger: function (time) {
      this.noise.start(time, 1);
      envelope(this.noise.gain, time, this.volume, 0.05, 
          0.01, 0.03, 0.25, this.release);
      var f = this.noise.filter.frequency;
      setValueAtTime(f, this.freqFrom, time);
      linearRampToValueAtTime(f, this.freqTo, time+0.1);
    }
  };

  function HiHat (volume, duration) {
    var hihat = new Noise();
    hihat.filter.type = "highpass";
    hihat.filter.frequency.value = 15000;
    hihat.filter.Q.value = 10;
    hihat.gain.gain.value = 0;
    this.hihat = hihat;
    this.out = this.hihat.out;
    this.volume = volume || 1;
    this.duration = duration||0;
  }

  HiHat.prototype = {
    trigger: function (time) {
      this.hihat.start(time, 1);
      envelope(this.hihat.gain, time, this.volume, this.duration, 
          0.01, 0.015, 0.2, this.duration);
    }
  };

  function Noise () {
    var bufferSize = 2 * ctx.sampleRate,
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate),
    output = noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    var whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    var gain = createGain();
    whiteNoise.connect(gain);

    var filter = ctx.createBiquadFilter();
    gain.connect(filter);
    filter.type = "lowpass";

    this.white = whiteNoise;
    this.gain = gain;
    this.out = this.filter = filter;
  }

  Noise.prototype = {
    start: function (time, duration) {
      startNode(this.white, time, 0, duration);
    }
  };

  function Stereo (left, right) {
    var merger = ctx.createChannelMerger();
    if (left.inp && right.inp) {
      var inp = createGain();
      inp.connect(left.inp);
      inp.connect(right.inp);
      this.inp = inp;
    }
    (left.out||left).connect(merger, 0, 0);
    (right.out||right).connect(merger, 0, 1);
    this.left = left;
    this.right = right;
    this.out = merger;
  }

  // Sounds!
  var out = createGain();
  var outCompressor = ctx.createDynamicsCompressor();

  var reverb = new Reverb(0.5);
  out.gain.value = 0;
  out.connect(reverb.inp);
  reverb.out.connect(outCompressor);
  outCompressor.connect(ctx.destination);

  var bassFilter = ctx.createBiquadFilter();
  bassFilter.frequency = 0;
  bassFilter.connect(out);

  var bass = (function () {
    var bass = new FM();
    bass.gain.gain.value = 0.3;
    var left = new Repeater(0.08, 0.3);
    left.gain.gain.value = 0.5;
    var right = new Repeater(0.05, 0.3);
    right.gain.gain.value = 0.8;
    bass.out.connect(left.inp);
    bass.out.connect(right.inp);
    var stereo = new Stereo(left, right);
    stereo.out.connect(bassFilter);
    return bass;
  }());
  bass.start(0);

  var wobRepeater = new Repeater();
  wobRepeater.out.connect(out);
  var wob = (function () {
    var wob = new CrazyWob();
    var delay = ctx.createDelay(0.5);
    delay.delayTime.value = 0.01;
    wob.out.connect(delay);
    var stereo = new Stereo(wob, delay);
    stereo.out.connect(wobRepeater.inp);
    return wob;
  }());

  var fatOut = createGain();
  fatOut.connect(out);
  fatOut.connect(wobRepeater.inp);

  var bpmOsc2mult = 3;
  var bpmNoiseMult = 10;
  var noiseBpmGain = createGain();
  noiseBpmGain.connect(out);
  var noiseBpm = new Noise();
  noiseBpm.out.connect(noiseBpmGain);
  noiseBpm.start(0);
  noiseBpm.gain.gain.value = 0.2;
  noiseBpm.filter.type = "bandpass";
  noiseBpm.filter.Q.value = 20;
  noiseBpm.filter.frequency.value = 0;

  var bpmNoiseLfoMult = 0.05;
  var bpmNoiseLfoPow = 1.3;
  var lfoBpm = createOscillator();
  lfoBpm.start(0);
  var lfoBpmGain = createGain();
  lfoBpmGain.gain.value = 0.8;
  lfoBpm.connect(lfoBpmGain);
  lfoBpmGain.connect(noiseBpmGain.gain);

  var osc2 = new OscGain();
  osc2.type = "sawtooth";
  osc2.osc.frequency.value = vars.bpm * bpmOsc2mult;
  osc2.osc.detune.value = 5;
  osc2.gain.gain.value = 0.1;
  osc2.out.connect(out);
  osc2.start(0);
  
  var onBpmChange = function (percent) {
    var t = ctx.currentTime;
    setValueAtTime(bass.osc.detune, -200*percent, t);
    linearRampToValueAtTime(bass.osc.detune, 0, t+0.2);

    setValueAtTime(osc2.osc.detune, -1000*percent, t);
    linearRampToValueAtTime(osc2.osc.detune, 0, t+0.2);
    setValueAtTime(osc2.osc.frequency, bpmOsc2mult * vars.bpm, t);
    setValueAtTime(osc2.osc.frequency, bpmOsc2mult * vars.bpm, t + getKickInterval());

    setValueAtTime(noiseBpm.filter.frequency, bpmNoiseMult * vars.bpm, t);
    setValueAtTime(lfoBpm.frequency, Math.pow(bpmNoiseLfoMult*vars.bpm, bpmNoiseLfoPow), t);
  }
  E.sub("bpmChange", onBpmChange);
  onBpmChange(0);

  var noise = new Noise();
  noise.filter.frequency.value = 180;
  noise.filter.Q.value = 20;
  noise.gain.gain.value = 0;
  noise.out.connect(out);
  noise.start(0);

  var drumOut = (function () {
    var left = new Repeater(0.05, 0.2);
    var right = new Repeater(0.08, 0.4);
    right.gain.gain.value = 0.8;
    return new Stereo(left, right);
  }());
  drumOut.out.connect(out);

  var meloOut = new Repeater();
  var meloVolume = 0.5;
  meloOut.gain.gain.value = meloVolume;
  meloOut.delay.delayTime.value = 0.3;
  meloOut.out.connect(out);

  var melo1, melo2, bassMelo, dubMelo;

  with (NOTES) {
    melo1 = [E3,G3,D3,G3,E3,A3,C3,G3];
    melo2 = [E3,B3,D3,G3,E3,C4,C3,D3];
    bassMelo = [G4,D4,F4,C4];
    dubMelo = [E3,G3,A3,E3,G3,a3,A3,E3,G3,A3,G3,E3];
  }

  var DELTAS = [
    Math.pow(2, 0),
    Math.pow(2, 1),
    Math.pow(2, 2)
  ];

  function applyArpeggio (freqParam, baseFreq, time, duration, arpDuration, deltas) {
    if (!deltas) deltas = DELTAS;
    var length = deltas.length;
    var ranges = [];
    cancelScheduledValues(freqParam, 0);
    for (var t = 0, i = 0; t <= duration; t += arpDuration, i = (i+1) % length) {
      setValueAtTime(freqParam, baseFreq * deltas[i], time + t);
    }
  }

  function meloNote (noteFreq, time, arpeggio, metallic) {
    var fm = new FM();
    var duration = 0.3;
    var release = 0.1;
    fm.osc.type = "triangle";
    fm.osc.frequency.value = 4 * noteFreq;
    fm.mod.osc.frequency.value = 3 * noteFreq;
    fm.mod.osc.type = "sine";
    fm.out.connect(meloOut.inp);
    setTimeout(function () {
      fm.out.disconnect(meloOut.inp);
    }, 1000);
    startNode(fm, time, 0, 1);
    arpeggio && applyArpeggio(fm.osc.frequency, 4 * noteFreq, time, duration+release, 0.025);
    envelope(fm.gain, time, 0.5, duration, 
        0.01, 0.02, 0.6, 0.2);
    envelope(fm.mod.gain, time, 4 * noteFreq * metallic, duration, 
        0.05, 0.1, 0.6, 0.2);
  }

  function dubStepAnnounce (time, m, duration) {
      var gain = createGain();
      gain.connect(out);
      var vibrato = createOscillator();
      vibrato.frequency.value = 10;
      vibrato.connect(gain.gain);
      var fm = new FM();
      var release = 0.3;
      var oscF = 200;
      var oscFamp = 150;
      var modF = 100;
      var modFamp = 80;

      fm.osc.type = "square";
      envelope(fm.gain, time, 0.5, duration, 
          0.03, 0.05, 0.3, 0.2);
      setValueAtTime(fm.osc.frequency, oscF-m*oscFamp, time);
      linearRampToValueAtTime(fm.osc.frequency, oscF+m*oscFamp, time+duration);
      setValueAtTime(fm.mod.osc.frequency, modF-m*modFamp, time);
      linearRampToValueAtTime(fm.mod.osc.frequency, modF+m*modFamp, time+duration-0.2);
      setValueAtTime(fm.mod.gain.gain, modF+modFamp, time);
      linearRampToValueAtTime(fm.mod.gain.gain, modF-modFamp, time+duration-0.2);
      fm.mod.osc.type = "sine";
      fm.out.connect(gain);
      setTimeout(function () {
        fm.out.disconnect(gain);
      }, Math.ceil(1000*(duration+release+0.2)));
      startNode(fm, time, 0, 1);
  }

  function tick (i, time) {
    E.pub("tick", [i, time]);
    var gt = getGameTime(time);
    var r = risk();

    glsl.set("dubloading", smoothstep(74, 90, i % 128));

    hasDubStep = dubstepStartAtTick !== null && dubstepStartAtTick <= i;
    var introduceDubstepPhase = i % 128 == 64 + 23;
    var concludeDubstepPhase = i % 128 == 64 + 63;
    var hasMelo = !hasDubStep && i > 64 && i % 64 < 32;
    var meloIsArpeggio = i % 128 < 64;
    var hasBass = dubstepStartAtTick === null;
    var hasHiHat = hasDubStep || i > 16;
    var hasSnare = dubstepStartAtTick === null && i % 4 == 2;

    var fatkick = false;
    var fatsnare = false;

    if (introduceDubstepPhase) {
      dubstepStartAtTick = i+3;
      dubstepEndAtTick = i+40+3;
      pulseOpeningStartTime = getGameTime(time);
      pulseOpeningEndTime = pulseOpeningStartTime + 3*getTickSpeed();

      dubStepAnnounce(time, 1, 4*getTickSpeed());

      fatkick = true;
      fatsnare = true;
      glsl.set("dubphase", true);
      triggerFeedbackMessage("FREESTYLE!", "#FFF", 3);
    }

    if (concludeDubstepPhase) {
      pulseClosingStartTime = getGameTime(time);
      pulseClosingEndTime = pulseClosingStartTime + 3*getTickSpeed();
      dubStepAnnounce(time, -1, 4*getTickSpeed());
    }

    if (i === dubstepStartAtTick) {
      wob.setVolume(time, 1);
      wob.setSpeed(time, vars.bpm/60);
      wob.setNoteFreq(time, NOTES.C4);
      setValueAtTime(wobRepeater.repeater.gain, 0, time);
      linearRampToValueAtTime(meloOut.gain.gain, 0, time+1);
      pulseOpeningStartTime = pulseOpeningEndTime = null;
      glsl.set("pulseOpenFrom", 0);
      glsl.set("pulseOpenTo", 1);
    }

    if (i === dubstepEndAtTick) {
      dubstepStartAtTick = null;
      wob.setVolume(time, 0);
      audio.setRepeater(time, 0);
      linearRampToValueAtTime(meloOut.gain.gain, meloVolume, time+2);
      glsl.set("dubphase", false);
      pulseClosingStartTime = pulseClosingEndTime = null;
      glsl.set("pulseOpenFrom", 0);
      glsl.set("pulseOpenTo", 0);
    }

    if (hasDubStep) {
      wob.setSpeed(time, Math.pow(2, 1+Math.floor(i/4)%3) * vars.bpm/60);
      wob.setNoteFreq(time, (i%16 < 8 ? 4 : 2)*(dubMelo[Math.floor(i/2)%dubMelo.length]));
      fatkick = i%2 == 0;
      fatsnare = true;
    }
      
    // Fat Bass each tick!
    if (fatkick) {
      var kick = new Kicker(200, 0.01, 0.2, 0.2);
      kick.volume = 0.4;
      kick.osc.type = "square";
      var filter = ctx.createBiquadFilter();
      filter.frequency.value = 300;
      filter.Q.value = 10;
      kick.out.connect(filter);
      filter.connect(fatOut);
      setTimeout(function () {
        filter.disconnect(fatOut.inp);
      }, 1000);
      kick.trigger(time);
    }

    if (fatsnare) {
      var snare = new Snare(0.6, 2000, 1000);
      snare.release = 0;
      snare.out.connect(fatOut);
      setTimeout(function () {
        snare.out.disconnect(fatOut);
      }, 1000);
      snare.trigger(time);
    }

    if (hasBass) {
      bassFilter.frequency.value = 3000 * smoothstep(16, 48, i);
      var oscFreq = bassMelo[Math.floor(i/4) % 4];
      bass.osc.frequency.value = oscFreq * 2.0;
      bass.mod.osc.frequency.value = oscFreq * 0.5;
      bass.mod.gain.gain.value = oscFreq*0.5 + 0.5*r;
    }

    if (hasMelo) {
      var metallic = 0.4 * r + 0.3 * smoothstep(-1, 1, Math.cos(Math.PI * i / 16));
      var melo = i % 16 < 8 ? melo1 : melo2;
      var octave = i % 32 < 16 ? 0 : 1;
      var m = melo[i % 8] * (1 << octave);
      meloNote(m, time, meloIsArpeggio, metallic);
    }

    if (hasHiHat) {
      var hihat = new HiHat(0.2, 0.02*vars.bpm/100);
      hihat.out.connect(drumOut.inp);
      setTimeout(function () {
        hihat.out.disconnect(drumOut.inp);
      }, 1000);
      hihat.trigger(time);
    }

    if (hasSnare) {
      var snare = new Snare(1, 1000, 1400);
      snare.out.connect(drumOut.inp);
      setTimeout(function () {
        snare.out.disconnect(drumOut.inp);
      }, 1000);
      snare.trigger(time);
    }
  }

  function risk () {
    return smoothstep(BPM_MIN*1.2, BPM_MIN, vars.bpm) +
      smoothstep(BPM_MAX*0.8, BPM_MAX, vars.bpm);
  }

  function update (time, gameTime) {
    var tickTime = getTickSpeed();
    var nextTickTime;
    while ((nextTickTime = lastTickTime + tickTime) < gameTime + scheduleAheadTime) {
      var audioTickTime = nextTickTime + (time - gameTime);
      currentTick ++;
      lastTickTime = nextTickTime;
      tick(currentTick, audioTickTime);
    }

    var r = risk();

    meloOut.repeater.gain.value = 0.1 + 0.3 * r;
    noise.gain.gain.value = 1.2 * r;
    reverb.mix(0.3+0.4*r);
  }

  function getFloatTick () {
    return currentTick + (getGameTime()-lastTickTime)/getTickSpeed();
  }

  function getTickSpeed () {
    return 60 / (ticksPerBeat * vars.bpm);
  }

  function getCurrentKickTime () {
    return vars.kick;
  }

  function getKickInterval () {
    return 4 * getTickSpeed();
  }

  return {
    ctx: ctx,
    update: update,
    getFloatTick: getFloatTick,
    getTickSpeed: getTickSpeed,
    getCurrentKickTime: getCurrentKickTime,
    getKickInterval: getKickInterval,
    kick: function (t, errorRate) {
      errorRate = errorRate * errorRate * errorRate;
      var freq = mix(100, 120, errorRate);
      var speed = mix(0.2, 0.3, errorRate) * 100 / vars.bpm;
      var kick = new Kicker(freq, 0.01, speed, speed);
      kick.volume = 1.5;
      kick.osc.type = "sine";
      var filter = ctx.createBiquadFilter();
      filter.frequency.value = mix(200, 300, errorRate);
      filter.Q.value = 10 + 10 * errorRate;
      kick.out.connect(filter);
      filter.connect(drumOut.inp);
      setTimeout(function () {
        filter.disconnect(drumOut.inp);
      }, 1000);
      kick.trigger(t);

      var snare = new Snare(0.5, 1000, 10);
      snare.out.connect(drumOut.inp);
      setTimeout(function () {
        snare.out.disconnect(drumOut.inp);
      }, 1000);
      snare.trigger(t);

      E.pub("kick", t);
    },
    start: function () {
      var gain = out.gain;
      cancelScheduledValues(gain, 0);
      setValueAtTime(gain, 1, ctx.currentTime);
    },
    stop: function () {
      var gain = out.gain;
      cancelScheduledValues(gain, 0);
      setValueAtTime(gain, 0, ctx.currentTime);
    },
    fadeIn: function (duration) {
      var t = ctx.currentTime;
      var gain = out.gain;
      cancelScheduledValues(gain, 0);
      setValueAtTime(gain, 0, t);
      linearRampToValueAtTime(gain, 1, t+duration);
    },
    fadeOut: function (duration) {
      var t = ctx.currentTime;
      var gain = out.gain;
      cancelScheduledValues(gain, 0);
      setValueAtTime(gain, 1, t);
      linearRampToValueAtTime(gain, 0, t+duration);
    },
    setRepeater: function (time, r) {
      setValueAtTime(wobRepeater.repeater.gain, 0, time);
      setValueAtTime(wobRepeater.delay.delayTime, 0.5*Math.random()*Math.random(), time);
      linearRampToValueAtTime(wobRepeater.repeater.gain, 0.98*r, time+0.01);
    }
  };
}());*/
