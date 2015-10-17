// Plugged Head 2015


$(document).ready(function() {
  // ===== Pause/Play state
  var playState = true;
  
  // ===== requestAnimationFrame browser check-a-roonie
  window.requestAnimationFrame = window.requestAnimationFrame || 	 
                                 window.mozRequestAnimationFrame ||
                                 window.webkitRequestAnimationFrame || 
                                 window.msRequestAnimationFrame;
  
  // ===== Web Audio context browser check-a-roonie
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // ===== Keep track of the mouse state
  var mouseDown = false;
  $(window)
  .mousedown(function() { mouseDown = true; })
  .mouseup(function() { mouseDown = false; });
  
  // ===== Load the samples & reload if they change src
  function loadAudio() {
    var samples = [];
    $('#samples input').each(function(i) {
      var src = $(this).val();
      var req = new XMLHttpRequest();
      req.open('GET', src, true);
      req.responseType = 'arraybuffer';
      
      req.onload = function() {
        audioCtx.decodeAudioData(req.response, function(buffer) {
          samples[i] = buffer;
        });
      }
      req.send();
    });
    return samples;
  }
  var samples = loadAudio();
  $('#samples input').change(function() {
    samples = loadAudio();
  });

  // ===== toggle the little drawer with the sample URLs
  $('#drawer').click(function(e) {
    if (e.offsetX < 2) { $('#drawer').toggleClass('active'); }
  });

  // ===== Toggle the notes active state based on mouse events
  $('.note')
  .mousedown(function() { $(this).toggleClass('active') })
  .mouseenter(function() { if (mouseDown) { $(this).toggleClass('active')} });

  // ===== Initialize knob interfaces
  $('.knob').knob();
  
  // ===== Keep track of master controls
  var masterControls = {
    volume: 0.5,
    pitch: 0.5,
    sustain: 0.5
  };
  $('.master').knob({ 'change': function(v) {
    masterControls[$(this.$[0]).attr('control')] = v / 100;
  }});
 
  // ===== reset button
  $('#resetBtn').click(function() {
    $('.note').removeClass('active');
    $('#panel .knob, .master').val(50).trigger('change');
  })
  
  // ===== pause/play button
  $('#pausePlayBtn').click(function() {
    playState = !playState;
  })
  
  // ===== saving and loading
  $('#saveBtn').click(function() {
    var state = {};
    state['wavURLs'] = [];
    $('#samples input').each(function() {
      state['wavURLs'].push($(this).val());
    });
    
    state['rows'] = [];
    $('#sequencer .row').each(function() {
      var row = [];
      $(this).children().each(function() {
        if ($(this).hasClass('active')) {
          row.push(1);
        } else {
        	row.push(0);                      
        }
      });
      state['rows'].push(row);
    });
    
    state['knobs'] = [];
    $('.knob').each(function() {
      state['knobs'].push($(this).val());
    });
    state['masters'] = [];
    $('.master').each(function() {
      state['masters'].push($(this).val());
    });
    
    prompt("Copy & Paste this to share", JSON.stringify(state));
  });
  function loadData(data) {
    data['rows'].forEach(function(row, i) {
      row.forEach(function(note, j) {
        if (note == 1) {
          $('#sequencer .row').eq(i).children('.note').eq(j).addClass('active');
        } else {
          $('#sequencer .row').eq(i).children('.note').eq(j).removeClass('active');
        }
      });
    });
    data['knobs'].forEach(function(val, i) {
      $('.knob').eq(i).val(val).trigger('change');
    });
    data['masters'].forEach(function(val, i) {
      $('.master').eq(i).val(val).trigger('change');
      if (i == 0) { masterControls['volume'] = Number(val) / 100; }
      if (i == 1) { masterControls['sustain'] = Number(val) / 100; }
      if (i == 2) { masterControls['pitch'] = Number(val) / 100; }
    });
  }
  $('#loadBtn').click(function() {
    var data = JSON.parse(prompt('Paste the track information', ''));
    loadData(data);
  });
  
  loadData({"wavURLs":["http://beta.pluggedhead.fr/sequenceur/sample/Kick.wav","https://dl.dropboxusercontent.com/u/87705298/sounds/snare.wav","https://dl.dropboxusercontent.com/u/87705298/sounds/hihat.wav","https://dl.dropboxusercontent.com/u/87705298/sounds/ssynth1.wav","https://dl.dropboxusercontent.com/u/87705298/sounds/ssynth2.wav","https://dl.dropboxusercontent.com/u/87705298/sounds/ssynth3.wav","http://beta.pluggedhead.fr/sequenceur/sample/DT_Synth5_ Ab4.wav","https://dl.dropboxusercontent.com/u/87705298/sounds/synth2.wav","https://dl.dropboxusercontent.com/u/87705298/sounds/6.wav"],"rows":[[1,1,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0],[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],[1,1,0,0,1,0,0,0,1,1,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"knobs":["100","100","20","17","50","50","50","10","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","50","96","50","50","13","50","50","50","50","50","100","50","100","12","50","50"],"masters":["50","27","50"]});
  
  // ===== Sequence!
  function Sequence() {
    var i = 0,
        sequenced = false,
        $instruments = $('#sequencer > .row');
    
    function update() {
      if (playState) {
        if (i >= 16) { i = 0; }
        if (!sequenced) {
          $('.led').removeClass('active');
          $('.led').eq(i).addClass('active');
          sequenced = true;
          $instruments.each(function(j) {
            var note = $($(this).children()[i]),
                gain = audioCtx.createGain(),
                sample = samples[j];

            if (note.hasClass('active')) {
              //sample.play();
              var source = audioCtx.createBufferSource();
              try {
                if (j < 6) {
                  gain.gain.value = masterControls.volume * (Number($('#sequencer > .row').eq(j).children('*').children('input').val()) / 100) * (Number($('#controls > *').eq(i).children('input').val()) / 100);
                } else {
                  gain.gain.value = masterControls.volume * (Number($('#sequencer > .row').eq(j).children('*').children('input').val()) / 100);
                }
              } catch(e) {
                // Sometiems firefox just doesn't want to play nice...
                console.log('some things don\'t work right in firefox');
              }
              if (j > 2 && j < 6) {
               source.playbackRate.value = (0.5 - masterControls.pitch) + 1 - (0.5 - (Number($('#controls > *').eq(i + 34).children('input').val()) / 100));
              } else {
                source.playbackRate.value = (0.5 - masterControls.pitch) + 1;
              }
              source.playbackRate = 1;
              try {
                source.buffer = sample;
                source.connect(gain);
                gain.connect(audioCtx.destination);
                source.start(0);
              } catch(e) {
                // The URL for a sample was probably left blank
                console.log('please fill in all sample URLs');
              }
            }
          });
          setTimeout(function() {
            i++;
            sequenced = false;
          }, masterControls.sustain * 10 * 2 * (Number($('#controls > *').eq(i + 17).children('input').val())));
        }
      }
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }
  Sequence();
});

$(window).load(function() { $('#preloader').hide(); $('#container').show(); });