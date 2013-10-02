function SimpleAudioManager() {

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
      vca.gain.value = config.volume;
    },
    stop: function() {
      vca.gain.value = 0;
    }
  }

}