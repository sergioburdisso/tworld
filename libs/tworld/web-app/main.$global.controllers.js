/*
* main.$global.controllers.js - 
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

function itemsListEnvsResolver($rootScope, $q) {
	if (!isLoggedIn()) return getEnvironments();
	else{
		var deferred = $q.defer();
		getEnvironments( function(response){ deferred.resolve(response); }, $rootScope );
		return deferred.promise;
	}
}

function itemsListAgentsResolver($rootScope, $q) {
	if (!isLoggedIn()) return getAgentPrograms();
	else{
		var deferred = $q.defer();
		getAgentPrograms( function(response){ deferred.resolve(response); }, $rootScope );
		return deferred.promise;
	}
}

function itemsListController($rootScope, $scope, $modalInstance, items, agentProgramsFlag){
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

	$scope.gotoTop = function(){
		$('.modal').animate({
			scrollTop: 0
		}, 1000, "easeOutExpo")
	}

	$scope.ok = function () {
		if (_selected == -1){
			$modalInstance.close(undefined);
			return;
		}

		if (!isLoggedIn())
			$modalInstance.close(
				agentProgramsFlag?
						getAgentProgramByDate(_selected):
						getEnvironmentByDate(_selected)
			);
		else
			if (!agentProgramsFlag)
				getEnvironmentByDate(
					_selected,
					function(response){ $modalInstance.close(response) }, $rootScope
				);
			else
				getAgentProgramByDate(
					_selected,
					function(response){ $modalInstance.close(response) }, $rootScope
				);
	};
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

function runTaskEnvResolver(id, $rootScope, $q) {
	if (!isLoggedIn()) return getEnvironmentByDate(id);
	else{
		var deferred = $q.defer();
		getEnvironmentByDate( id, function(response){ deferred.resolve(response); }, $rootScope );
		return deferred.promise;
	}
}

function runModalController($rootScope, $scope, $modal, $modalInstance, taskEnv, agentProgs){
	var nAgents = 0;
	$scope.task_env = taskEnv;
	$scope.agents = taskEnv.trial.agents;
	$scope.teams = new Array(taskEnv.teams.length);
	$scope.cameras = _CAMERA_TYPE;

	$scope.run = function () {if (Validate()){
		$scope.task_env.trial.agents = $scope.agents;
		$scope.task_env.trial.test= false;

		saveKnobs($scope.task_env);
		saveEnvironmentRunDefaults($scope.task_env, $rootScope)

		startTWorld();
		$modalInstance.close()
	}};
	$scope.close = function () {$modalInstance.dismiss()};

	$scope.singleTeam = function(){return $scope.task_env.teams.length === 1}
	$scope.singleAgent = function(){return !$scope.task_env.prop.multiagent}

	$scope.selectAgentProgram = function(agent_id){
		$modal.open({
			size: 'lg',//size,
			templateUrl: 'items-list-modal.html',
			controller: itemsListController,
			resolve:{
				items: itemsListAgentsResolver,
				agentProgramsFlag:function(){return true}
			}
		})
		.result.then(
			function (agentProg) { $scope.agents[agent_id].program = agentProg; }
		);
	}

	$scope.viewSettings = function(){
		$modal.open({
			templateUrl: 'settings-modal.html',
			controller: settingsModalController
		})
	}

	function loadAgentProgAsync(agent, date){
		if (!isLoggedIn())
			agent.program = getAgentProgramByDate(date);
		else{
			getAgentProgramByDate(
				date,
				function(response){
					agent.program = response;
					$scope.$apply();
				},
				$rootScope
			);
			agent.program = {date: date, name: "Loading..."};
		}
	}

	//updating previously saved list of agents and teams (from the last execution)
	for (var len=$scope.agents.length, a=agentProgs.length; a < len;++a)
		if ($scope.agents[a].program)
			loadAgentProgAsync($scope.agents[a], $scope.agents[a].program.date)

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

			$scope.agents[nAgents].team = t;
			$scope.teams[t][m] = $scope.agents[nAgents];
		}
	}
	//updating number of agents (in case user has edited the task envitonment)
	$scope.agents.length = nAgents;
}

function yesNoModalController($scope, $modal, $modalInstance, title, msg){
	$scope.title = title;
	$scope.msg = msg;
	$scope.ok = function(){$modalInstance.close()};
	$scope.close = function () {$modalInstance.dismiss()};
}

function readKeyController($scope, $modal, $modalInstance){
	function _keyDownHandler(e){
		if ($modalInstance)
			$modalInstance.close(e.keyCode);
		$(document).unbind('keydown', _keyDownHandler);
	}

	$(document).keydown(_keyDownHandler);
}

function settingsModalController($scope, $modal, $modalInstance){
	var _selected = 0;
	$scope.sett = getSettings();

	$scope.isVideoTab = function(){return _selected === 0}
	$scope.isDisplayTab = function(){return _selected === 1}
	$scope.isAudioTab = function(){return _selected === 2}
	$scope.isGeneralTab = function(){return _selected === 3}

	$scope.setVideoTab = function(){_selected = 0}
	$scope.setDisplayTab = function(){_selected = 1}
	$scope.setAudioTab = function(){_selected = 2}
	$scope.setGeneralTab = function(){_selected = 3}

	$scope.save = function(){
		saveSettings($scope.sett, $modalInstance.close);
		if (!isLoggedIn())
			$modalInstance.close();
	};
	$scope.cancel = function () {$modalInstance.dismiss()};

}
