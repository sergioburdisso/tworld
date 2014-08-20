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


var taskEnvironments = getEnvironments();
var agentPrograms = getAgentPrograms();
var trials;
var agentProgramsTrials;
var taskEnvironmentTrials;

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
function saveTrials(trials, agentProgramsTrials, taskEnvironmentTrials){
	localStorage.trials = JSON.stringify(trials);
	localStorage.agentProgramsTrials = JSON.stringify(agentProgramsTrials);
	localStorage.taskEnvironmentTrials = JSON.stringify(taskEnvironmentTrials)
}
function clearTrials(){
	localStorage.removeItem("trials");
	localStorage.removeItem("agentProgramsTrials");
	localStorage.removeItem("taskEnvironmentTrials")
}

function getAgentProgramsTrials(){return localStorage.agentProgramsTrials? JSON.parse(localStorage.agentProgramsTrials) : []}
function getTaskEnvironmentTrials(){return localStorage.taskEnvironmentTrials? JSON.parse(localStorage.taskEnvironmentTrials) : []}

//TODO: bisection
function getEnvironmentIndexByDate(date){date=parseInt(date);
	var i = taskEnvironments.length;
	while (i--)
		if (taskEnvironments[i].date === date)
			return i;
	return -1;
}
function getEnvironmentByDate(date){date=parseInt(date);
	var i = getEnvironmentIndexByDate(date);
	return (i != -1)? taskEnvironments[i] : null;
}

//TODO: bisection
function getAgentProgramIndexByDate(date){date=parseInt(date);
	var i = agentPrograms.length;
	while (i--)
		if (agentPrograms[i].date === date)
			return i;
	return -1;
}

function getAgentProgramByDate(date){date=parseInt(date);
	var i = getAgentProgramIndexByDate(date);
	return (i != -1)? agentPrograms[i] : null;
}

function getKnobs(){return localStorage.knobs? JSON.parse(localStorage.knobs) : null}
function saveKnobs(env, test){
	if (test) env.trial.test= true; //default trial (test trial)
	localStorage.knobs = JSON.stringify(env);
}
function clearKnobs(){localStorage.removeItem("knobs")}




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

function itemsListController($scope, $modalInstance, items, agentProgramsFlag){
	var _selected = -1;

	$scope.items = items;
	$scope.orderCond = "-date";
	$scope.environments = !agentProgramsFlag;
	$scope.page = 1
	$scope.itemsPerPage = 15;
	$scope.query = agentProgramsFlag?
				{
					name:"",
					ai:true,
					javascript:true,
					keyboard:true,
					allProps: true,
				}
				:
				{
					name:"",
					allProps: true,
					battery: false,
					prop: {
						fullyObservable: true,
						multiagent: false,
						deterministic: true,
						dynamic: 0, //0 static; 1 semidynamic; 2 dynamic
						known: true
					}
				};

	$scope.text = {
		title: agentProgramsFlag? "Select An Agent Program" : "Select A Task Environment",
		filter: agentProgramsFlag? "Only Agent Programs that are:" : "Only Task environments that are:"
	}

	$scope.ok = function () {$modalInstance.close(_selected)};
	$scope.close = function () {$modalInstance.dismiss()};

	$scope.setSelected = function(value){_selected = value}
	$scope.isSelected = function(value){return _selected == value}
	$scope.userFilter = function(item){
		var regEx = new RegExp($scope.query.name,"i");

		if (agentProgramsFlag){
			var q = $scope.query;
			return regEx.test(item.name) && (
					$scope.query.allProps ||
					(
						q.ai == item.ai && (
							(q.ai && q.javascript == item.javascript)
							||
							(!q.ai && q.keyboard == item.keyboard)
						)
					)
				);
		}else{
			var p = $scope.query.prop;
			return regEx.test(item.name) && (
					$scope.query.allProps ||
					(
						$scope.query.battery == item.battery &&
						p.fullyObservable == item.prop.fullyObservable &&
						p.multiagent == item.prop.multiagent &&
						p.deterministic == item.prop.deterministic &&
						p.dynamic == item.prop.dynamic &&
						p.known == item.prop.known
					)
			);
		}
	}
};

function runModalController($scope, $modal, $modalInstance, taskEnv, agentProgs){
	var nAgents = 0;
	$scope.task_env = taskEnv;
	$scope.agents = $scope.task_env.trial.agents;
	$scope.teams = new Array(taskEnv.teams.length);
	$scope.cameras = _CAMERA_TYPE;

	$scope.run = function () {
		$scope.task_env.trial.agents = $scope.agents;
		$scope.task_env.trial.test= false;

		saveKnobs($scope.task_env);
		saveEnvironments();//saveEnvironment(taskEnv)

		startTWorld();
		$modalInstance.close()
	};
	$scope.close = function () {$modalInstance.dismiss()};

	$scope.singleTeam = function(){return $scope.task_env.teams.length === 1}
	$scope.singleAgent = function(){return !$scope.task_env.prop.multiagent}

	$scope.selectAgentProgram = function(agent_id){
		var modalInstance = $modal.open({
				size: 'lg',//size,
				templateUrl: 'items-list-modal.html',
				controller: itemsListController,
				resolve:{
					items:function(){return getAgentPrograms()},
					agentProgramsFlag:function(){return true}
				}
			});

		modalInstance.result.then(
			function (agent_program_id) {
				if (!$scope.agents[agent_id].program || $scope.agents[agent_id].program.date != agent_program_id)
					$scope.agents[agent_id].program = getAgentProgramByDate(agent_program_id); 
			}
		);
	}

	//updating previously saved list of agents and teams (from the last execution)
	for (var a=$scope.agents.length; a--;)
		if ($scope.agents[a].program)
			$scope.agents[a].program = getAgentProgramByDate($scope.agents[a].program.date)

	//initializing list of agents and teams
	for (var elen=taskEnv.teams.length, t=0; t < elen; ++t){
		$scope.teams[t] = new Array(taskEnv.teams[t].members)
		for (var tlen=$scope.teams[t].length, m=0; m < tlen; ++m, ++nAgents){
			if ($scope.agents.length <= nAgents)
				$scope.agents.push(null);

			if (!$scope.agents[nAgents])
				$scope.agents[nAgents] = {
					team: t,
					id: nAgents,
					program: agentProgs[nAgents]
				};
			else
				if (agentProgs[nAgents])
					$scope.agents[nAgents].program = agentProgs[nAgents];

			$scope.teams[t][m] = $scope.agents[nAgents];
		}
	}
	//updating number of agents (in case user has edited the task envitonment)
	$scope.agents.length = nAgents;

}

function readKeyController($scope, $modal, $modalInstance){
	var _keyCode = undefined;

	function _keyDownHandler(e){
		if ($modalInstance)
			$modalInstance.close(e.keyCode);
		$(document).unbind('keydown', _keyDownHandler);
	}

	$(document).keydown(_keyDownHandler);
}