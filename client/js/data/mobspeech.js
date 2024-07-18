/* global Types */
define(['text!../../shared/data/mobs_speech.json'], function(MobsSpeechJson) {

	var MobSpeech = {};
	MobSpeech.Speech = {};
	var mobParse = JSON.parse(MobsSpeechJson);
	$.each( mobParse, function( key, value ) {
		MobSpeech.Speech[key] = value;
	});
    return MobSpeech;
});
