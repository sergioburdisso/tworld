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
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>
*/

if (localStorage.version != "0.9"){
	localStorage.clear();
	localStorage.version = "0.9";
}

//TODO: all gets and remove should be implemented by a "bisection search" O(log(n)) orded by date
var taskEnvironments;
var agentPrograms;
var trials;
var __lookupSession__ = {info: localStorage.session_info || null};
var _tworldWindow;

var defaults = {
	settings:{
				video:{
					lq_grid:false,
					lq_env:false,
					cover_window: false,
					resolution: "854x480"
				},
				display:{
					show_fps: true,
					show_holes_helpers: true,
					show_visibility_bounds: true,
					show_console: true
				},
				audio:{
					enabled: true,
					volume: 80
				},
				general:{}
			},
	taskEnvironments : [],
	agentPrograms : []
}

var _KEYBOAR_MAP = ["","","","CANCEL","","","HELP","","BACK_SPACE","TAB","","","CLEAR","ENTER","RETURN","","SHIFT","CONTROL","ALT","PAUSE","CAPS_LOCK","KANA","EISU","JUNJA","FINAL","HANJA","","ESCAPE","CONVERT","NONCONVERT","ACCEPT","MODECHANGE","SPACE","PAGE_UP","PAGE_DOWN","END","HOME","LEFT","UP","RIGHT","DOWN","SELECT","PRINT","EXECUTE","PRINTSCREEN","INSERT","DELETE","","0","1","2","3","4","5","6","7","8","9","COLON","SEMICOLON","LESS_THAN","EQUALS","GREATER_THAN","QUESTION_MARK","AT","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","WIN","","CONTEXT_MENU","","SLEEP","NUMPAD0","NUMPAD1","NUMPAD2","NUMPAD3","NUMPAD4","NUMPAD5","NUMPAD6","NUMPAD7","NUMPAD8","NUMPAD9","MULTIPLY","ADD","SEPARATOR","SUBTRACT","DECIMAL","DIVIDE","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20","F21","F22","F23","F24","","","","","","","","","NUM_LOCK","SCROLL_LOCK","WIN_OEM_FJ_JISHO","WIN_OEM_FJ_MASSHOU","WIN_OEM_FJ_TOUROKU","WIN_OEM_FJ_LOYA","WIN_OEM_FJ_ROYA","","","","","","","","","","CIRCUMFLEX","EXCLAMATION","DOUBLE_QUOTE","HASH","DOLLAR","PERCENT","AMPERSAND","UNDERSCORE","OPEN_PAREN","CLOSE_PAREN","ASTERISK","PLUS","PIPE","HYPHEN_MINUS","OPEN_CURLY_BRACKET","CLOSE_CURLY_BRACKET","TILDE","","","","","VOLUME_MUTE","VOLUME_DOWN","VOLUME_UP","","","","","COMMA","","PERIOD","SLASH","BACK_QUOTE","","","","","","","","","","","","","","","","","","","","","","","","","","","OPEN_BRACKET","BACK_SLASH","CLOSE_BRACKET","QUOTE","","META","ALTGR","","WIN_ICO_HELP","WIN_ICO_00","","WIN_ICO_CLEAR","","","WIN_OEM_RESET","WIN_OEM_JUMP","WIN_OEM_PA1","WIN_OEM_PA2","WIN_OEM_PA3","WIN_OEM_WSCTRL","WIN_OEM_CUSEL","WIN_OEM_ATTN","WIN_OEM_FINISH","WIN_OEM_COPY","WIN_OEM_AUTO","WIN_OEM_ENLW","WIN_OEM_BACKTAB","ATTN","CRSEL","EXSEL","EREOF","PLAY","ZOOM","","PA1","WIN_OEM_CLEAR",""];
var _LOGIN_STATE = {HIDDEN : 0, SHOWN: 1, LOADING:2, LOGGED: 3, LOGOUT: 4}

function getSessionData(){
	if (isLoggedIn()){
		__lookupSession__.info = localStorage.session_info?
						JSON.parse(localStorage.session_info)
						:
						(sessionStorage.session_info?
							JSON.parse(sessionStorage.session_info)
							:
							null
						);
	}else
		__lookupSession__.info = null;
	return __lookupSession__;
}

function saveSessionInfo(){
	if (localStorage.session_info)
		localStorage.session_info = JSON.stringify(__lookupSession__.info);
	else
		sessionStorage.session_info = JSON.stringify(__lookupSession__.info);
}

function isLoggedIn(){ return gettt() != undefined}

function LoggedIn(data, remember){
	var session_info = {
					email	: atob(data.e),
					username: atob(data.u),
					name	: atob(data.n),
					settings: JSON.parse(data.s)
				}
	__lookupSession__.info = session_info;
	if (remember){
		localStorage.tt = data.tt;
		localStorage.session_info = JSON.stringify(session_info);
	}else{
		sessionStorage.tt = data.tt;
		sessionStorage.session_info = JSON.stringify(session_info);
	}
}

function LogOut(callback){
	$.ajax({
		type: "POST", url : 'http://tworld-ai.com/rest/logout.php',
		data : gettt(),
		success:function(data, textStatus, jqXHR){
			localStorage.removeItem('session_info');
			sessionStorage.removeItem('session_info');
			localStorage.removeItem('tt');
			sessionStorage.removeItem('tt');
			if (callback)
			callback.call();
		},
		error: function(jqXHR, textStatus, errorThrown){
			localStorage.removeItem('session_info');
			sessionStorage.removeItem('session_info');
			localStorage.removeItem('tt');
			sessionStorage.removeItem('tt');
			location.reload();
		}
	});
}

function gettt(){
	return localStorage.tt? localStorage.tt :
			(sessionStorage.tt? sessionStorage.tt : undefined);
}

function sendToTCloud($data, onsucces, $root, onerror){
	var data = gettt();

	if (!$root)$root = {}
	$root.$loading = true;

	for (p in $data)
		if (!($data[p] instanceof Function))
			data+= "&"+p+"="+$data[p];
	data+="&ch="+antiNoobsHash(data);

	onerror = onerror || function(jqXHR, textStatus, errorThrown){console.error(jqXHR, textStatus, errorThrown); LogOut()};

	$.ajax({
		type: "POST",
		url : 'http://tworld-ai.com/rest/main.php',
		data : data,
		success: function(data, textStatus, jqXHR){
			$root.$loading = false;
			onsucces(data, textStatus, jqXHR);
		},
		error: onerror
	});
}

function saveEnvironments(){ localStorage.taskEnvironments = JSON.stringify(taskEnvironments) }
function clearEnvironments(){localStorage.removeItem("taskEnvironments")}
function updateEnvitonments(){return ( taskEnvironments= getEnvironments() )}
function saveAgentPrograms(){localStorage.agentPrograms = JSON.stringify(agentPrograms)}
function clearAgentPrograms(){localStorage.removeItem("agentPrograms")}
function updateAgentPrograms(){return ( agentPrograms = getAgentPrograms() )}
function saveTrials(trials){localStorage.trials = JSON.stringify(trials)}
function clearTrials(){localStorage.removeItem("trials")}

function getEnvironments(callback, $root){
	if (!isLoggedIn())
		return localStorage.taskEnvironments? JSON.parse(localStorage.taskEnvironments) : [];
	else
		sendToTCloud(
			{m:'get_environments'},
			function(data, textStatus, jqXHR){ callback.call(this, data); },
			$root
		);
}
function newEnvironment(env, callback, $root){
	env.date = Date.now();
	if (!isLoggedIn())
		{updateEnvitonments(); taskEnvironments.push(env); saveEnvironments();}
	else
		sendToTCloud(
			{m:'new_environment', date: env.date, env: JSON.stringify(env)},
			function(data, textStatus, jqXHR){ callback.call(); },
			$root
		);
}
function removeEnvironmentByDate(date, callback, $root){date=parseInt(date);
	if (!isLoggedIn()){
		var i = getEnvironmentIndexByDate(date);
		//1) removing trials
		var _trials = getTrials();
		for (var j=_trials.length; j--;)
			if (_trials[j].task_env_id == date)
				_trials.remove(j);
		saveTrials(_trials);
		//2) removing environment from list
		if (i != -1){
			taskEnvironments.remove(i);
			saveEnvironments();
		}
		return getEnvironments();
	}else
		sendToTCloud(
			{m:'remove_environment', date: date},
			function(data, textStatus, jqXHR){ callback.call(this, data); },
			$root
		);
}
function updateEnvironment(env, callback, $root){
	if (!isLoggedIn()){
		updateEnvitonments();
		taskEnvironments[ getEnvironmentIndexByDate(env.date, true) ] = env;
		saveEnvironments();
		if (callback) callback.call();
	}else
		sendToTCloud(
			{m:'update_environment', date: env.date, env: JSON.stringify(env)},
			function(data, textStatus, jqXHR){ if (callback) callback.call(); },
			$root
		);
}
function getEnvironmentByDate(date, callback, $root){date=parseInt(date);
	if (!isLoggedIn()){
		var i = getEnvironmentIndexByDate(date);
		return (i != -1)? taskEnvironments[i] : null;
	}else
		sendToTCloud(
			{m:'get_environment', date: date},
			function(data, textStatus, jqXHR){ callback.call(this, data); },
			$root
		);
}
function emptyTrialsEnvironment(date, callback, $root){
	if (!isLoggedIn()){
		var _trials = getTrials();
		for (var i=_trials.length; i--;)
			if (_trials[i].task_env_id == date)
				return false;
		return true;
	}else
		sendToTCloud(
			{m:'empty_trials_environment', date: date},
			function(data, textStatus, jqXHR){ callback.call(this, data.v); },
			$root
		);
}
function saveEnvironmentRunDefaults(env, $root){
	/*deleting not useful information*/
	for (var a = env.trial.agents.length; a--;)
		env.trial.agents[a].program = {
			date: env.trial.agents[a].program.date,
			name: env.trial.agents[a].program.name
		};
	updateEnvironment(env, null, $root);
}

function newAgentProgram(ap, callback, $root){
	ap.date = Date.now();
	if (!isLoggedIn())
		{updateAgentPrograms(); agentPrograms.push(ap); saveAgentPrograms();}
	else
		sendToTCloud(
			{m:'new_agent_program', date: ap.date, ap: JSON.stringify(ap)},
			function(data, textStatus, jqXHR){ callback.call(); },
			$root
		);
}
function getAgentPrograms(callback, $root){
	if (!isLoggedIn())
		return localStorage.agentPrograms? JSON.parse(localStorage.agentPrograms) : [];
	else
		sendToTCloud(
			{m:'get_agent_programs'},
			function(data, textStatus, jqXHR){ callback.call(this, data); },
			$root
		);
}
function updateAgentProgram(ap, callback, $root){
	if (!isLoggedIn()){
		updateAgentPrograms();
		agentPrograms[ getAgentProgramIndexByDate(ap.date, true) ] = ap;
		saveAgentPrograms();
		if (callback) callback.call();
	}else
		sendToTCloud(
			{m:'update_agent_program', date: ap.date, ap: JSON.stringify(ap)},
			function(data, textStatus, jqXHR){ if (callback) callback.call(); },
			$root
		);
}
function removeAgentProgramByDate(date, callback, $root){date=parseInt(date);
	if (!isLoggedIn()){
		var k = getAgentProgramIndexByDate(date);
		//1) remove trials
		var _trials = getTrials();
		for (var i=_trials.length; i--;)
			for (var j=_trials[i].agents.length; j--;)
				if (_trials[i].agents[j].program_id == date){
					_trials.remove(i);
					break;
				}
		saveTrials(_trials);
		//2) remove memory
		if (localStorage.memory){
			var mem = JSON.parse(localStorage.memory);
			delete mem[date];
			localStorage.memory = JSON.stringify(mem);
		}
		//3) remove from list
		if (k != -1){
			agentPrograms.remove(k);
			saveAgentPrograms();
		}
		return getAgentPrograms();
	}else
		sendToTCloud(
			{m:'remove_agent_program', date: date},
			function(data, textStatus, jqXHR){ callback.call(this, data); },
			$root
		);
}
function getAgentProgramByDate(date, callback, $root){date=parseInt(date);
	if (!isLoggedIn()){
		var i = getAgentProgramIndexByDate(date);
		return (i != -1)? agentPrograms[i] : null;
	}else
		
		sendToTCloud(
			{m:'get_agent_program', date: date},
			function(data, textStatus, jqXHR){ callback.call(this, data); },
			$root
		);
}
function emptyTrialsAgentProgram(date, callback, $root){
	if (!isLoggedIn()){
		var _trials = getTrials();
		for (var i=_trials.length; i--;)
			for (var j=_trials[i].agents.length; j--;)
				if (_trials[i].agents[j].program_id == date)
					return false;
		return true;
	}else
		sendToTCloud(
			{m:'empty_trials_agent_program', date: date},
			function(data, textStatus, jqXHR){ callback.call(this, data.v); },
			$root
		);
}

function getTrials(callback, $root){
	if (!isLoggedIn())
		return localStorage.trials? JSON.parse(localStorage.trials) : [];
	else
		sendToTCloud(
			{m:'get_trials'},
			function(data, textStatus, jqXHR){ callback.call(this,data); },
			$root
		);
}
function getTrialByDate(date, callback, $root){date=parseInt(date);
	if (!isLoggedIn()){
		var trials = getTrials();
		for (var i = trials.length; i--;)
			if (trials[i].date === date)
				return trials[i];
		return null;
	}else
		sendToTCloud(
			{m:'get_trial', date: date},
			function(trial, textStatus, jqXHR){ callback.call(this, trial); },
			$root
		);
}
function newTrial(trial, taskEnvDate, agentProgs, callback){
	if (!isLoggedIn()){
		trials = getTrials();
		trials.push(trial);
		saveTrials(trials);
	}else
		sendToTCloud(
			{
				m:'new_trial',
				date: trial.date,
				trial: JSON.stringify(trial),
				env_date: taskEnvDate,
				agents: JSON.stringify(agentProgs)
			},
			function(data, textStatus, jqXHR){ callback.call(); }
		);
}
function removeTrial(date, callback, $root){
	if (!isLoggedIn()){
		_trials = getTrials();

		for (var t=_trials.length; t--;)
			if (_trials[t].date == date)
				_trials.remove(t);

		saveTrials(_trials);
	}else
		sendToTCloud(
			{m:'remove_trial', date: date},
			function(data, textStatus, jqXHR){ callback.call(); },
			$root
		);
}


function getSettings(callback, $root){
	if ( !isLoggedIn() )
		return localStorage.settings? JSON.parse(localStorage.settings) : defaults.settings;
	else{
		console.log(getSessionData(), getSessionData().settings);
		return getSessionData().info.settings || defaults.settings;
	}
}
function saveSettings(settings, callback, $root){
	if (!isLoggedIn())
		localStorage.settings = JSON.stringify(settings)
	else{
		getSessionData().info.settings = settings;
		saveSessionInfo();
		sendToTCloud(
			{m:'save_settings', sett: JSON.stringify(settings)},
			function(data, textStatus, jqXHR){ callback.call(); },
			$root
		);
	}
}
function clearSettings(){localStorage.removeItem("settings")}

function getMemoryByAgentProgramID(id){
	if (localStorage.memory)
		return JSON.parse(localStorage.memory)[id];
	return undefined;
}
//memory type: json string
function saveMemoryByAgentProgramID(id, memory){
	var mem = {};

	if (localStorage.memory)
		mem = JSON.parse(localStorage.memory);

	mem[id] = JSON.parse(memory);

	localStorage.memory = JSON.stringify(mem);
}


function getKnobs(){return localStorage.knobs? JSON.parse(localStorage.knobs) : null}
function saveKnobs(env, test){
	if (test) env.trial.test= true; //default trial (test trial)
	localStorage.knobs = JSON.stringify(env);
}
function clearKnobs(){localStorage.removeItem("knobs")}

function getEnvironmentIndexByDate(date, noUpdate){date=parseInt(date);
	if (!noUpdate)
		updateEnvitonments();
	for (var i = taskEnvironments.length; i--;)
		if (taskEnvironments[i].date === date)
			return i;
	return -1;
}

function getAgentProgramIndexByDate(date, noUpdate){date=parseInt(date);
	if (!noUpdate)
		updateAgentPrograms();
	for (var i = agentPrograms.length; i--;)
		if (agentPrograms[i].date === date)
			return i;
	return -1;
}
//<--




function startTWorld(){
	if (!_tworldWindow || !_tworldWindow.location.reload)
		_tworldWindow = window.open('tworld.html');//,'T-World','width=712, height=450');//height=400
	else{
		_tworldWindow.location.reload();
		_tworldWindow.focus();
	}
}

function gotoTop(time, top){
	if (time === undefined)
		time = 1000;
	$('html, body').animate({
		scrollTop: top===undefined? $("#top").offset().top : 0
	}, time, "easeOutExpo")
}



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

Array.prototype.flattening = function(pos) {
	var flatten = [];
	var subFlatten;

	for (var len= this.length, i=0; i < len; ++i){
		if (this[i] instanceof Array){
			subFlatten = this[i].flattening(!pos && (this.length > 1 || (this.length == 1 && !(this[0] instanceof Array)))? i+1 : pos);
			for (var slen= subFlatten.length, j=0; j < slen; ++j)
				flatten.push(subFlatten[j]);
		}else{
			this[i].pos = pos || i + 1;
			flatten.push(this[i]);
		}
	}

	return flatten;
}

function Validate(){
	var errors = $('.has-error').not($('.ng-hide .has-error'));
	if (errors.length){
		errors.addClass("ng-dirty").focus();
		return false;
	}
	return true;
}

//-> custom events
function triggerClickOutside(){
	setTimeout(function() { $('button').trigger('clickOutsideEvent'); }, 0);
}

function triggerError(){
	setTimeout(function() { $('form').trigger('errorEvent'); }, 0);
}

function triggerDismissError(){
	setTimeout(function() { $('form').trigger('dismissError'); }, 0);
}
//<-


//-> improving Object class! XD

//Object.nextProperty = function(prop){ <- JQuery crashes! dont know why
function NextProperty(obj, prop){
	var prevProp = null;
	for (p in obj)
		if (!(obj[p] instanceof Function))
			if (prevProp == prop)
				return p;
			else
				prevProp = p;
	return "";
}

function clone(obj){return JSON.parse(JSON.stringify(obj))}

//<-

//Pseudo random generator
function pRandom(value, MAX){
	var golder_ratio = (1+Math.sqrt(5))/2;
	var q = 1/golder_ratio;

	return MAX*(value*q-((value*q)|0))|0;
}

function SortAndPartition(list, criteria){
	var tiePartitions = [];
	var oapList = [];// oap stands for "Ordered and Partitioned"

	criteria = NextProperty(list[0].stats, criteria);

	//recursion stopping condition
	if (list.length <= 1 || !criteria)
		return list;

	//sorting the list according to criteria
	if (criteria[0] == "M")
		list.sort(function(a,b){return b.stats[criteria] - a.stats[criteria]});
	else
		list.sort(function(b,a){return b.stats[criteria] - a.stats[criteria]});

	//creating partitions according to equal results (tied cases)
	for (var prevValue = null, k=-1, i=0; i < list.length; i++)
		if (list[i].stats[criteria] === prevValue)
			tiePartitions[k].push(list[i]);
		else{
			//creating a new partition of "equal values"
			tiePartitions.push([list[i]]);
			prevValue = list[i].stats[criteria];
			k++;
		}

	//for each partition
	for (var p=0; p < tiePartitions.length; ++p)
		oapList.push(
			SortAndPartition(tiePartitions[p], criteria) //recursive call
		);

	return oapList;
}

function antiNoobsCoder(str){
	var output = "";
	for (var l= str.length, c=0; c < l;++c)
		output+= String.fromCharCode(str.charCodeAt(c) ^ 0x17);
	return output;
}

function antiNoobsHash(str){
	var output = 0;
	var _p = Math.PI-3;

	for (var l= str.length, c=0; c < l;++c)
		output+= str.charCodeAt(c) ^ 0xA4;

	return ((_p*output - ((_p*output)|0))*4294967295)|0;
}
