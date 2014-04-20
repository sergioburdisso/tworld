/**
*solid-general-settings.js
*<p>
*(description here)
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

var _CONTROLLED_BY_HUMAN = false;

var _SHOW_HOLES_HELPERS = true;

var _SHOW_FPS = true;

//auto calculate Rob's walking speed according to user's PC performance
//in order for the time the "walk" action takes to be the same regardless the user's PC performance
//var _AUTO_CORRECTION_ONCE = false; //true: auto calculate only once, false: auto calculate after each action

//resolution
var _RENDER_AUTO_SIZE = true;
var _RENDER_HEIGHT = 100;
var _RENDER_WIDTH = 100;

var _CAMERA_SMOOTH = true;
var _MINIMAL_UPDATE_DELAY = 1; //the less, the smoother the animation (0 = automatic, != 0 set a fixed update delay)


//Audio
var _AUDIO_ENABLE = true;
//volumen
//mute