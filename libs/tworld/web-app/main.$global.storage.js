/*
* main.$global.storage.js - 
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

//TODO: all evocative services (such as get/remove etc) should be implemented by a "bisection search" O(log(n)) over date
var taskEnvironments;
var agentPrograms;
var trials;
var __lookupSession__ = {info: localStorage.session_info || null};

var _KEYBOAR_MAP = ["","","","CANCEL","","","HELP","","BACK_SPACE","TAB","","","CLEAR","ENTER","RETURN","","SHIFT","CONTROL","ALT","PAUSE","CAPS_LOCK","KANA","EISU","JUNJA","FINAL","HANJA","","ESCAPE","CONVERT","NONCONVERT","ACCEPT","MODECHANGE","SPACE","PAGE_UP","PAGE_DOWN","END","HOME","LEFT","UP","RIGHT","DOWN","SELECT","PRINT","EXECUTE","PRINTSCREEN","INSERT","DELETE","","0","1","2","3","4","5","6","7","8","9","COLON","SEMICOLON","LESS_THAN","EQUALS","GREATER_THAN","QUESTION_MARK","AT","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","WIN","","CONTEXT_MENU","","SLEEP","NUMPAD0","NUMPAD1","NUMPAD2","NUMPAD3","NUMPAD4","NUMPAD5","NUMPAD6","NUMPAD7","NUMPAD8","NUMPAD9","MULTIPLY","ADD","SEPARATOR","SUBTRACT","DECIMAL","DIVIDE","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20","F21","F22","F23","F24","","","","","","","","","NUM_LOCK","SCROLL_LOCK","WIN_OEM_FJ_JISHO","WIN_OEM_FJ_MASSHOU","WIN_OEM_FJ_TOUROKU","WIN_OEM_FJ_LOYA","WIN_OEM_FJ_ROYA","","","","","","","","","","CIRCUMFLEX","EXCLAMATION","DOUBLE_QUOTE","HASH","DOLLAR","PERCENT","AMPERSAND","UNDERSCORE","OPEN_PAREN","CLOSE_PAREN","ASTERISK","PLUS","PIPE","HYPHEN_MINUS","OPEN_CURLY_BRACKET","CLOSE_CURLY_BRACKET","TILDE","","","","","VOLUME_MUTE","VOLUME_DOWN","VOLUME_UP","","","","","COMMA","","PERIOD","SLASH","BACK_QUOTE","","","","","","","","","","","","","","","","","","","","","","","","","","","OPEN_BRACKET","BACK_SLASH","CLOSE_BRACKET","QUOTE","","META","ALTGR","","WIN_ICO_HELP","WIN_ICO_00","","WIN_ICO_CLEAR","","","WIN_OEM_RESET","WIN_OEM_JUMP","WIN_OEM_PA1","WIN_OEM_PA2","WIN_OEM_PA3","WIN_OEM_WSCTRL","WIN_OEM_CUSEL","WIN_OEM_ATTN","WIN_OEM_FINISH","WIN_OEM_COPY","WIN_OEM_AUTO","WIN_OEM_ENLW","WIN_OEM_BACKTAB","ATTN","CRSEL","EXSEL","EREOF","PLAY","ZOOM","","PA1","WIN_OEM_CLEAR",""];
var _LOGIN_STATE = {HIDDEN : 0, SHOWN: 1, LOADING:2, LOGGED: 3, LOGOUT: 4}

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
	taskEnvironment: {
		trial: {//Each trial is a self-contained simulation
			/*default trial values*/
			test: false,
			runs: 1,
			saveStats: false,
			agents : [],
			speed: 0, //[-9..9]
			pause:  true,
			camera: _CAMERA_TYPE.AROUND_GRID
		},
		name:'',
		desc:'',
		date:undefined,
		battery: false,
		prop: {
			fullyObservable: true,
			multiagent: false,
			multiagent_type: 0, //0 competitive; 1 cooperative; 2 both
			deterministic: true,
			dynamic: 0, //0 static; 1 semidynamic; 2 dynamic
			known: true
		},
		agents:{
			percept:{
				partialGrid: true,
				radius: 2,
				noise: false,
				noise_cfg:{
					tile:0.3,
					obstacle:0.3,
					hole:0.3
				}
			},
			stochastic_model: {
				type: _STOCHASTIC_ACTIONS_MODEL.ANOTHER_ACTION,
				prob: [700, 0, 0, 0, 0]
			}
		},
		environment:{
			rows:6,
			columns:6,
			holes_size:{range:[1,3], prob:[]},
			num_holes:{range:[2,3], prob:[]},
			num_obstacles:{range:[1,2], prob:[]},
			difficulty:{range:[0,0], prob:[]},
			scores_variability: 0,
			dynamic:{
				dynamism:{range:[6,13], prob:[]},
				hostility:{range:[1,13], prob:[]},
				hard_bounds:true,
			},
			random_initial_state:false,
			initial_state:[
				[" "," "," "," "," ","#"],
				["#"," "," ","2"," ","#"],
				[" ","#"," ","T"," ","A"],
				["1","T"," "," "," ","#"],
				["#"," "," "," ","T","#"],
				[" ","#"," ","#","3"," "]
			],
			final_state:[{name:_ENDGAME.TIME.NAME, value:5*60, result:_GAME_RESULT.NEUTRAL}] //default value
		},
		teams:[],
		final_tweaks:{
			easy: false,
			battery:{
				level:1000,
				good_move:20,
				bad_move:5,
				sliding:10
			},
			multiplier:{
				enabled:false,
				timeout:6
			},
			score:{
				cell: true
			},
			shapes:false
		}
	},
	agentProgram: { 
		name:"",
		desc:"",
		date:0,
		team:-1,
		ai: true,
		javascript:true,
		source:{
			file: false,
			agentProgram:{
				cursor:{row:0, column:0},
				code:
					'/*\n'+
					'* Use this function to write your "agent program" (Colloquially speaking, your "robot\'s brain")\n'+
					'* This function is called each time the agent (i.e. the robot) finish performing an action.\n'+
					'* It receives a <percept> object and based on the information provided by this object it should $return\n'+
					'* the right _ACTION.\n'+
					'* NOTE: Allowed _ACTIONS(s) are:\n'+
					'*       _ACTION.NORTH   or _NORTH\n'+
					'*       _ACTION.SOUTH   or _SOUTH\n'+
					'*       _ACTION.WEST    or _WEST\n'+
					'*       _ACTION.EAST    or _EAST\n'+
					'*       _ACTION.RESTORE or _RESTORE    robot restores its battery\n'+
					'*       _ACTION.NONE    or _NONE       robot do nothing so it just perceives, i.e. this\n'+
					'*                                      AGENT_PROGRAM function is executed with a\n'+
					'*                                      new, updated, <percept> object (calling the $perceive()\n'+
					'*                                      function produces the same effect)\n'+
					'*\n'+
					'* The structure of the <percept> parameter below is described in the support material\n'+
					'*/\n'+
					'function AGENT_PROGRAM(percept){\n'+
					'\n'+
					'    $return(_ACTION.NONE); //<- An example of how actions should be returned\n'+
					'}'
			},
			onStart:{
				cursor:{row:0, column:0},
				code:
					'/*\n'+
					'* Write here the code you only want to run once when the simulation starts, e.g.\n'+
					'* variables / data structures initialization\n'+
					'*/\n'+
					'\n'+
					'\n'+
					'/*\n'+
					'* this function handles the on-start event.\n'+
					'* The On-start event is fired when the 3D T-World game starts\n'+
					'* and the perception is sent for the very first time.\n'+
					'*/\n'+
					'function onStart(percept){\n'+
					'\n'+
					'}'
			},
			onMessage:{
				cursor:{row:0, column:0},
				code:
					'/*\n'+
					'* NOTE: If your agent is not going to perform in a cooperative\n'+
					'* multiagent environment, then just ignore this section of code;\n'+
					'* Otherwise write here the code you want to run every time your agent \n'+
					'* receives a message from a teammate.\n'+
					'*/\n'+
					'\n'+
					'\n'+
					'/*\n'+
					'* this function handles the on-message-received event.\n'+
					'* The on-message-received event is fired when the agent receives a message\n'+
					'* from a teammate.\n'+
					'* NOTE: there are two functions to send messages to the agent\'s teammates:\n'+
					'*\n'+
					'*   $sendMessage(agentID, message)  sends <message> object to the agent\n'+
					'*                                   with id <agentID> e.g.\n'+
					'*                                   $sendMessage(1, {newGoal: [10,15]});\n'+
					'*                                   sends a message to the "agent 1" saying,\n'+
					'*                                   for instance, that the "New Goal" is at (10,15)\n'+
					'*\n'+
					'*   $sendTeamMessage(message))      sends <message> object to all the\n'+
					'*                                   agent\'s teammates\n'+
					'*/\n'+
					'function onMessageReceived(message){\n'+
					'  \n'+
					'}'
			},
			global:{
				cursor:{row:0, column:0},
				code:
					'/*\n'+
					'* this section of code is used to declare/define variables that are visible/accessible\n'+
					'* from all the other sections of code, namely the "Agent Program", "Start Event" and "Message Received Event"\n'+
					'* sections above\n'+
					'*/'
			}
		},
		socket:{
			ip_address: "localhost",
			port:3313,
			magic_string: "",
			percept_format: _PERCEPT_FORMAT.JSON
		},
		percept:{
				sync:true,
				interval:500
		},
		keyboard:true,
		controls:{Up:38, Down:40, Left:37, Right:39, Restore:16}
	},
	taskEnvironments : [],
	agentPrograms : []
}

// TASk ENVIRONMENTS
function saveEnvironments(){ localStorage.taskEnvironments = JSON.stringify(taskEnvironments) }
function clearEnvironments(){localStorage.removeItem("taskEnvironments")}
function updateEnvitonments(){return ( taskEnvironments= getEnvironments() )}
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

// AGENT PROGRAMS
function saveAgentPrograms(){localStorage.agentPrograms = JSON.stringify(agentPrograms)}
function clearAgentPrograms(){localStorage.removeItem("agentPrograms")}
function updateAgentPrograms(){return ( agentPrograms = getAgentPrograms() )}
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
function downloadAgentProgramSourceCode(date, $root){if (isLoggedIn()){//$root.$loading = true;
	var data, name, tmp = gettt().split('&'),
		iframe = document.getElementsByName("download-iframe")[0],
		form = document.createElement("form"),
		node = document.createElement("input");

	data = {m : 'get_agent_program_code', date: date};

	for (var i=tmp.length; i--;){
		tmp[i] = tmp[i].split('=');
		data[tmp[i][0]] = tmp[i][1];
	}

	iframe.addEventListener("load", function () { $root.$loading = false; });//not working

	form.action = 'http://tworld-ai.com/rest/main.php';
	form.target = iframe.name;
	form.method = "post";
	form.style.display = "none";

	for(name in data) 
		if (!(data[name] instanceof Function)){
			node.name  = name;
			node.value = data[name].toString();
			form.appendChild(node.cloneNode());
		}

	document.body.appendChild(form);

	form.submit();

	document.body.removeChild(form);

}}
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
function getMemoryByAgentProgramDate(date, callback, $root){
	if (!isLoggedIn())
		return localStorage.memory? JSON.parse(localStorage.memory)[date] : undefined;
	else
		sendToTCloud(
			{m:'get_agent_program_memory', date: date},
			function(data, textStatus, jqXHR){ callback.call(this, data); },
			$root
		);
}
function saveMemoryByAgentProgramDate(date, memory/*json string*/, callback, $root){if (memory == "{}"){if(callback)callback.call();return;}
	if (!isLoggedIn()){
		var mem = {};
		if (localStorage.memory)
			mem = JSON.parse(localStorage.memory);
		mem[date] = JSON.parse(memory);
		localStorage.memory = JSON.stringify(mem);
	}else
		sendToTCloud(
			{m:'save_agent_program_memory', date: date, mem: memory},
			function(data, textStatus, jqXHR){ if(callback)callback.call(); },
			$root
		);
}

// STATS/TRIALS
function saveTrials(trials){localStorage.trials = JSON.stringify(trials)}
function clearTrials(){localStorage.removeItem("trials")}
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

// SETTINGS
function getSettings(callback, $root){
	if ( !isLoggedIn() )
		return localStorage.settings? JSON.parse(localStorage.settings) : defaults.settings;
	else
		return getSessionData().info.settings || defaults.settings;
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

// KNOBS
function getKnobs(){return localStorage.knobs? JSON.parse(localStorage.knobs) : null}
function clearKnobs(){localStorage.removeItem("knobs")}
function saveKnobs(env, test){
	if (test) env.trial.test= true; //default trial (test trial)
	localStorage.knobs = JSON.stringify(env);
}

// T-USER
function isLoggedIn(){ return gettt() != undefined}
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
function LoggedIn(data, remember){
	var session_info = {
					email	: atob(data.e),
					username: atob(data.u),
					name	: atob(data.n),
					settings: data.s? JSON.parse(atob(data.s)) : null
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
	sendToTCloud(
		{m:'user_logout'},
		function(data, textStatus, jqXHR){
			localStorage.removeItem('session_info');
			sessionStorage.removeItem('session_info');
			localStorage.removeItem('tt');
			sessionStorage.removeItem('tt');
			if (callback)
			callback.call();
		},
		null,
		function(jqXHR, textStatus, errorThrown){
			localStorage.removeItem('session_info');
			sessionStorage.removeItem('session_info');
			localStorage.removeItem('tt');
			sessionStorage.removeItem('tt');
			location.reload();
		}
	);
}
function gettt(){
	return localStorage.tt? localStorage.tt :
			(sessionStorage.tt? sessionStorage.tt : undefined);
}

// T-World T-Cloud interface
function sendToTCloud($data, onsucces, $root, onerror){
	var data = gettt();

	if (!$root)$root = {}
	$root.$loading = true;

	for (p in $data)
		if (!($data[p] instanceof Function))
			data+= "&"+p+"="+encodeURIComponent($data[p]);
	//data+="&ch="+antiNoobsHash(data);

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

function sendToTCloudWithFile($data, $file, onsucces, $root, onerror){
	var data = new FormData();
	var tmp = gettt().split('&');

	if (!$root)$root = {}
	$root.$loading = true;

	onerror = onerror || function(jqXHR, textStatus, errorThrown){console.error(jqXHR, textStatus, errorThrown); LogOut()};

	for (var i=tmp.length; i--;){
		tmp[i] = tmp[i].split('=');
		data.append(tmp[i][0], tmp[i][1]);
	}
	for (p in $data)
		if (!($data[p] instanceof Function))
			data.append(p, $data[p]);
	data.append('file', $file);

	$.ajax({
		url: 'http://tworld-ai.com/rest/main.php',
		data: data,
		processData: false,
		contentType: false,
		type: 'POST',
		success: function(data, textStatus, jqXHR){
			$root.$loading = false;
			onsucces(data, textStatus, jqXHR);
		},
		error: onerror
	});
}