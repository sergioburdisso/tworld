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

	$scope.gotoTop = function(){
		$('.modal').animate({
			scrollTop: 0
		}, 1000, "easeOutExpo")
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

	updateAgentPrograms();

	$scope.run = function () {if (Validate()){
		$scope.task_env.trial.agents = $scope.agents;
		$scope.task_env.trial.test= false;

		saveKnobs($scope.task_env);
		saveEnvironments();//saveEnvironment(taskEnv)

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
				items:function(){return getAgentPrograms()},
				agentProgramsFlag:function(){return true}
			}
		})
		.result.then(
			function (agent_program_id) {
				if (!$scope.agents[agent_id].program || $scope.agents[agent_id].program.date != agent_program_id)
					$scope.agents[agent_id].program = getAgentProgramByDate(agent_program_id); 
			}
		);
	}

	$scope.viewSettings = function(){
		$modal.open({
			templateUrl: 'settings-modal.html',
			controller: settingsModalController
		})
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
	$scope.isAudioTab = function(){return _selected === 1}
	$scope.isGeneralTab = function(){return _selected === 2}

	$scope.setVideoTab = function(){_selected = 0}
	$scope.setAudioTab = function(){_selected = 1}
	$scope.setGeneralTab = function(){_selected = 2}

	$scope.save = function(){
		saveSettings($scope.sett);
		$modalInstance.close()
	};
	$scope.cancel = function () {$modalInstance.dismiss()};

}