/*
* main.$global.js - 
*
* Copyright (C) 2014 Burdisso Sergio (sergio.burdisso@gmail.com)
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>
*/

if (!localStorage.version){
	localStorage.clear();
	localStorage.version = "0.8";
}else
	if (localStorage.version == "0.8"){
		localStorage.version = "0.81";
		localStorage.removeItem("taskEnvironments")
	}


var taskEnvironments;
var agentPrograms;
var trials;

var _KEYBOAR_MAP = ["","","","CANCEL","","","HELP","","BACK_SPACE","TAB","","","CLEAR","ENTER","RETURN","","SHIFT","CONTROL","ALT","PAUSE","CAPS_LOCK","KANA","EISU","JUNJA","FINAL","HANJA","","ESCAPE","CONVERT","NONCONVERT","ACCEPT","MODECHANGE","SPACE","PAGE_UP","PAGE_DOWN","END","HOME","LEFT","UP","RIGHT","DOWN","SELECT","PRINT","EXECUTE","PRINTSCREEN","INSERT","DELETE","","0","1","2","3","4","5","6","7","8","9","COLON","SEMICOLON","LESS_THAN","EQUALS","GREATER_THAN","QUESTION_MARK","AT","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","WIN","","CONTEXT_MENU","","SLEEP","NUMPAD0","NUMPAD1","NUMPAD2","NUMPAD3","NUMPAD4","NUMPAD5","NUMPAD6","NUMPAD7","NUMPAD8","NUMPAD9","MULTIPLY","ADD","SEPARATOR","SUBTRACT","DECIMAL","DIVIDE","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20","F21","F22","F23","F24","","","","","","","","","NUM_LOCK","SCROLL_LOCK","WIN_OEM_FJ_JISHO","WIN_OEM_FJ_MASSHOU","WIN_OEM_FJ_TOUROKU","WIN_OEM_FJ_LOYA","WIN_OEM_FJ_ROYA","","","","","","","","","","CIRCUMFLEX","EXCLAMATION","DOUBLE_QUOTE","HASH","DOLLAR","PERCENT","AMPERSAND","UNDERSCORE","OPEN_PAREN","CLOSE_PAREN","ASTERISK","PLUS","PIPE","HYPHEN_MINUS","OPEN_CURLY_BRACKET","CLOSE_CURLY_BRACKET","TILDE","","","","","VOLUME_MUTE","VOLUME_DOWN","VOLUME_UP","","","","","COMMA","","PERIOD","SLASH","BACK_QUOTE","","","","","","","","","","","","","","","","","","","","","","","","","","","OPEN_BRACKET","BACK_SLASH","CLOSE_BRACKET","QUOTE","","META","ALTGR","","WIN_ICO_HELP","WIN_ICO_00","","WIN_ICO_CLEAR","","","WIN_OEM_RESET","WIN_OEM_JUMP","WIN_OEM_PA1","WIN_OEM_PA2","WIN_OEM_PA3","WIN_OEM_WSCTRL","WIN_OEM_CUSEL","WIN_OEM_ATTN","WIN_OEM_FINISH","WIN_OEM_COPY","WIN_OEM_AUTO","WIN_OEM_ENLW","WIN_OEM_BACKTAB","ATTN","CRSEL","EXSEL","EREOF","PLAY","ZOOM","","PA1","WIN_OEM_CLEAR",""];

Array.prototype.remove = function(index) {
	var output=this[index];

	for (var i= index; i < this.length; ++i)
		this[i] = this[i+1];
	this.length--;

	return output;
}

Array.prototype.setTo = function(arr) {
	if (arr.length != this.length)
		this.length = arr.length;

	var i= this.length;
	while(i--)
		this[i] = arr[i];
}

Array.prototype.contains = function(obj) {
	var i = this.length;
	while (i--) {
		if (this[i] == obj) {
			return true;
		}
	}
	return false;
}

function clone(obj){return JSON.parse(JSON.stringify(obj))}

function getEnvironments(){return localStorage.taskEnvironments? JSON.parse(localStorage.taskEnvironments) : []}
function saveEnvironments(){localStorage.taskEnvironments = JSON.stringify(taskEnvironments)}
function clearEnvironments(){localStorage.removeItem("taskEnvironments")}

function getAgentPrograms(){return localStorage.agentPrograms? JSON.parse(localStorage.agentPrograms) : []}
function saveAgentPrograms(){localStorage.agentPrograms = JSON.stringify(agentPrograms)}
function clearAgentPrograms(){localStorage.removeItem("agentPrograms")}

function getTrials(){return localStorage.trials? JSON.parse(localStorage.trials) : []}
function saveTrials(trials){localStorage.trials = JSON.stringify(trials)}
function clearTrials(){localStorage.removeItem("trials")}

function removeTaskEnvironmentTrials(task_env_id){
	var _trials = getTrials();
	for (var i=_trials.length; i--;)
		if (_trials[i].task_env_id == task_env_id)
			_trials.remove(i);
	saveTrials(_trials);
}

function removeAgentProgramTrials(agent_program_id){
	var _trials = getTrials();
	for (var i=_trials.length; i--;)
		for (var j=_trials[i].agents.length; j--;)
			if (_trials[i].agents[j].program_id == agent_program_id){
				_trials.remove(i);
				break;
			}
	saveTrials(_trials);
}

function isTaskEnvironmentTrialsEmpty(task_env_id){
	var _trials = getTrials();
	for (var i=_trials.length; i--;)
		if (_trials[i].task_env_id == task_env_id)
			return false;
	return true;
}
function isAgentProgramTrialsEmpty(agent_program_id){
	var _trials = getTrials();
	for (var i=_trials.length; i--;)
		for (var j=_trials[i].agents.length; j--;)
			if (_trials[i].agents[j].program_id == agent_program_id)
				return false;
	return true;
}
//TODO: bisection
function getEnvironmentIndexByDate(date){date=parseInt(date);
	for (var i = taskEnvironments.length; i--;)
		if (taskEnvironments[i].date === date)
			return i;
	return -1;
}
function getEnvironmentByDate(date){date=parseInt(date);
	var i = getEnvironmentIndexByDate(date);
	return (i != -1)? taskEnvironments[i] : null;
}

function removeEnvironmentByDate(date){date=parseInt(date);
	var i = getEnvironmentIndexByDate(date);
	if (i != -1){
		taskEnvironments.remove(i);
		saveEnvironments();
	}
}

//TODO: bisection
function getAgentProgramIndexByDate(date){date=parseInt(date);
	for (var i = agentPrograms.length; i--;)
		if (agentPrograms[i].date === date)
			return i;
	return -1;
}

function getAgentProgramByDate(date){date=parseInt(date);
	var i = getAgentProgramIndexByDate(date);
	return (i != -1)? agentPrograms[i] : null;
}
function removeAgentProgramByDate(date){date=parseInt(date);
	var i = getAgentProgramIndexByDate(date);
	if (i != -1){
		agentPrograms.remove(i);
		saveAgentPrograms();
	}
}
function getKnobs(){return localStorage.knobs? JSON.parse(localStorage.knobs) : null}
function saveKnobs(env, test){
	if (test) env.trial.test= true; //default trial (test trial)
	localStorage.knobs = JSON.stringify(env);
}
function clearKnobs(){localStorage.removeItem("knobs")}

function getSettings(){
	return localStorage.settings?
			JSON.parse(localStorage.settings)
			:
			{
				display:{
					lq_grid:false,
					lq_env:false,
					cover_window: false,
					resolution: "854x480",
					show_fps: true
				},
				audio:{
					enabled: true,
					volume: 80
				},
				general:{}
			};
}
function saveSettings(settings){localStorage.settings = JSON.stringify(settings)}
function clearSettings(){localStorage.removeItem("settings")}

function getMemoryByAgentProgramID(id){
	if (localStorage.memory)
		return JSON.parse(localStorage.memory)[id];
	return undefined;
}

function removeMemoryByAgentProgramID(id){
	if (localStorage.memory){
		var mem = JSON.parse(localStorage.memory);
		delete mem[id];
		localStorage.memory = JSON.stringify(mem);
	}
}

function saveMemoryByAgentProgramID(id, memory){
	var mem = {};

	if (localStorage.memory)
		mem = JSON.parse(localStorage.memory);

	mem[id] = JSON.parse(memory);

	localStorage.memory = JSON.stringify(mem);
}

var _tworldWindow;
function startTWorld(){
	if (!_tworldWindow || !_tworldWindow.window)
		_tworldWindow = window.open('tworld.html');//,'T-World','width=712, height=450');//height=400
	else
		_tworldWindow.location = 'tworld.html';
	_tworldWindow.focus();
}

function gotoTop(){
	$('html, body').animate({
		scrollTop: $("#top").offset().top
	}, 1000, "easeOutExpo")
}
