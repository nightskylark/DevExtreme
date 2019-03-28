var $ = require("../../core/renderer");
var INKRIPPLE_CLASS = "dx-inkripple";
var INKRIPPLE_WAVE_CLASS = "dx-inkripple-wave";
var INKRIPPLE_SHOWING_CLASS = "dx-inkripple-showing";
var INKRIPPLE_HIDING_CLASS = "dx-inkripple-hiding";
var DEFAULT_WAVE_SIZE_COEFFICIENT = 2;

var // NOTE: incorrect scaling of ink with big size (T310238)
MAX_WAVE_SIZE = 4000;

var ANIMATION_DURATION = 300;
var HOLD_ANIMATION_DURATION = 1000;
var DEFAULT_WAVE_INDEX = 0;

var render = function(args) {
    args = args || {};

    if(args.useHoldAnimation === undefined) {
        args.useHoldAnimation = true;
    }

    var config = {
        waveSizeCoefficient: args.waveSizeCoefficient || DEFAULT_WAVE_SIZE_COEFFICIENT,
        isCentered: args.isCentered || false,
        wavesNumber: args.wavesNumber || 1,
        durations: getDurations(args.useHoldAnimation)
    };

    return {
        showWave: showWave.bind(this, config),
        hideWave: hideWave.bind(this, config)
    };
};

var getInkRipple = function(element) {
    var result = element.children("." + INKRIPPLE_CLASS);

    if(result.length === 0) {
        result = $("<div>")
            .addClass(INKRIPPLE_CLASS)
            .appendTo(element);
    }

    return result;
};

var getWaves = function(element, wavesNumber) {
    var inkRipple = getInkRipple(element);
    var result = inkRipple.children("." + INKRIPPLE_WAVE_CLASS).toArray();

    for(var i = result.length; i < wavesNumber; i++) {
        var $currentWave = $("<div>")
            .appendTo(inkRipple)
            .addClass(INKRIPPLE_WAVE_CLASS);

        result.push($currentWave[0]);
    }

    return $(result);
};

var getWaveStyleConfig = function(args, config) {
    var element = config.element;
    var elementWidth = element.outerWidth();
    var elementHeight = element.outerHeight();
    var elementDiagonal = parseInt(Math.sqrt(elementWidth * elementWidth + elementHeight * elementHeight));
    var waveSize = Math.min(MAX_WAVE_SIZE, parseInt(elementDiagonal * args.waveSizeCoefficient));
    var left;
    var top;

    if(args.isCentered) {
        left = (elementWidth - waveSize) / 2;
        top = (elementHeight - waveSize) / 2;
    } else {
        var event = config.event;
        var position = config.element.offset();
        var x = event.pageX - position.left;
        var y = event.pageY - position.top;

        left = x - waveSize / 2;
        top = y - waveSize / 2;
    }

    return {
        left: left,
        top: top,
        height: waveSize,
        width: waveSize
    };
};

var showWave = function(args, config) {
    var $wave = getWaves(config.element, args.wavesNumber).eq(config.wave || DEFAULT_WAVE_INDEX);

    args.hidingTimeout && clearTimeout(args.hidingTimeout);
    hideSelectedWave($wave);
    $wave.css(getWaveStyleConfig(args, config));
    args.showingTimeout = setTimeout(showingWaveHandler.bind(this, args, $wave), 0);
};

var showingWaveHandler = function(args, $wave) {
    var durationCss = args.durations.showingScale + "ms";

    $wave
        .addClass(INKRIPPLE_SHOWING_CLASS)
        .css("transitionDuration", durationCss);
};

var getDurations = function(useHoldAnimation) {
    return {
        showingScale: useHoldAnimation ? HOLD_ANIMATION_DURATION : ANIMATION_DURATION,
        hidingScale: ANIMATION_DURATION,
        hidingOpacity: ANIMATION_DURATION
    };
};

var hideSelectedWave = function($wave) {
    $wave
        .removeClass(INKRIPPLE_HIDING_CLASS)
        .css("transitionDuration", "");
};

var hideWave = function(args, config) {
    args.showingTimeout && clearTimeout(args.showingTimeout);

    var $wave = getWaves(config.element, config.wavesNumber).eq(config.wave || DEFAULT_WAVE_INDEX);
    var durations = args.durations;
    var durationCss = durations.hidingScale + "ms, " + durations.hidingOpacity + "ms";

    $wave
        .addClass(INKRIPPLE_HIDING_CLASS)
        .removeClass(INKRIPPLE_SHOWING_CLASS)
        .css("transitionDuration", durationCss);

    var animationDuration = Math.max(durations.hidingScale, durations.hidingOpacity);
    args.hidingTimeout = setTimeout(hideSelectedWave.bind(this, $wave), animationDuration);
};

module.exports = {
    render: render
};

