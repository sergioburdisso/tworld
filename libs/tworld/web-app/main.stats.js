/*
* main.stats.js - 
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
(function(){
	var mod = angular.module('tworldStats', []);

	mod.controller('StatsController', ['$scope', '$location', '$routeParams', '$modal', 'taskEnv', 'agentProg',
	function($scope, $location, $routeParams, $modal, taskEnv, agentProg){
		var _self = this;
		var _selected = -1;
		var _trials = getTrials();

		this.task_env = taskEnv;
		this.agent_prog = agentProg;

		this.orderCond = '-date';
		this.page = 1
		this.itemsPerPage = 20;

		this.trials = [];
		for (var i=_trials.length, newTrial, apFlag=0, aps=[]; i--; apFlag=aps.length=0){
			if (!this.task_env || this.task_env.date == _trials[i].task_env_id){

				for (var j=_trials[i].agents.length; j--;)
					if (!aps.contains(_trials[i].agents[j].program_id)){
						aps.push(_trials[i].agents[j].program_id);

						if (_trials[i].agents[j].program_id == $routeParams.agent_prog_id)
							apFlag = true;
					}

				if (!this.agent_prog || apFlag){

					newTrial = {
						date: _trials[i].date,
						task_env_id: _trials[i].task_env_id,
						agent_progs: '',
						agent_progs_num: 0
					}

					if (this.task_env)
						newTrial.task_env_name = this.task_env.name;
					else
						newTrial.task_env_name = loadNameAsync(newTrial);

					newTrial.agent_progs+= getAgentProgramByDate(aps[0]).name;
					for (var j=1; j < aps.length;++j)
						newTrial.agent_progs+= ', ' + getAgentProgramByDate(aps[j]).name;

					newTrial.agent_progs_num = aps.length;

					this.trials.push(newTrial);

				}
			}
		}

		this.setSelected = function(value){_selected = value}
		this.isSelected = function(value){return _selected == value}

		this.remove = function(){
			_trials = getTrials();

			for (var t=_self.trials.length; t--;)
				if (_self.trials[t].date == _selected)
					_self.trials.remove(t);

			for (var t=_trials.length; t--;)
				if (_trials[t].date == _selected)
					_trials.remove(t);

			saveTrials(_trials);
		}

		this.selectTaskEnvironment = function(){
			$modal.open({
				size: 'lg',
				templateUrl: 'items-list-modal.html',
				controller: itemsListController,
				resolve:{
					items: itemsListEnvsResolver,
					agentProgramsFlag:function(){return false}
				}
			})
			.result.then(
				function (taskEnv) {
					$location.url(
						'/stats/task-env:'+taskEnv.date+'&agent-prog:'+($routeParams.agent_prog_id||'all')
					);
					gotoTop()
				}
			);
		}

		this.selectAgentProgram = function(){
			$modal.open({
				size: 'lg',
				templateUrl: 'items-list-modal.html',
				controller: itemsListController,
				resolve:{
					items:function(){return getAgentPrograms()},
					agentProgramsFlag:function(){return true}
				}
			})
			.result.then(
				function (agentProg) {
					$location.url('/stats/task-env:'+($routeParams.task_env_id||'all')+'&agent-prog:'+agentProg.date);
					gotoTop()
				}
			);
		}

		this.viewStats = function(taskEnvDate){
			$modal.open({
				size: 'lg',
				templateUrl: 'view-stats.html',
				controller: viewStatsController,
				resolve:{
					trial: function(){return _selected},
					taskEnv: function ($rootScope, $q){
						return runTaskEnvResolver(taskEnvDate, $rootScope, $q)
					}
				}
			});
		}

		function loadNameAsync(trial){
			if (!isLoggedIn())
				return getEnvironmentByDate(_trials[i].task_env_id).name;
			else{
				getEnvironmentByDate(
					_trials[i].task_env_id,
					function(response){
						trial.task_env_name = response.name;
						$scope.$apply();
					}
				);
				return "loading...";
			}
		}

		function viewStatsController($scope, $modal, $modalInstance, trial, taskEnv){
			$scope.trial = getTrialByDate(trial);
			$scope.task_env = taskEnv;
			$scope.teams = $scope.task_env.teams;
			$scope.teamsTable = false;

			for(var a = $scope.trial.agents.length, agent, team; a--;){
				agent = $scope.trial.agents[a];
				team = $scope.teams[agent.team];

				agent.name = getAgentProgramByDate(agent.program_id).name;

				agent.stats = {
					MTotalScore: agent.stats.total_score,
					MHoles: agent.stats.filled_holes,
					MCells: agent.stats.filled_cells,
					mGoodMoves: agent.stats.good_moves,
					mBadMoves: agent.stats.bad_moves,
					mBatteryUsed: agent.stats.battery_used,
					mBatteryRestore: agent.stats.battery_restore,
					mBatteryRecharge: agent.stats.battery_recharge
				}

				if (!team.stats)
					team.stats = {}
				team.score = (team.score|0) + agent.score;
				team.stats.MTotalScore = (team.stats.MTotalScore|0) + agent.stats.MTotalScore;
				team.stats.MHoles= (team.stats.MHoles|0) + agent.stats.MHoles;
				team.stats.MCells= (team.stats.MCells|0) + agent.stats.MCells;
				team.stats.mGoodMoves= (team.stats.mGoodMoves|0) + agent.stats.mGoodMoves;
				team.stats.mBadMoves= (team.stats.mBadMoves|0) + agent.stats.mBadMoves;
				team.stats.mBatteryUsed= (team.stats.mBatteryUsed|0) + agent.stats.mBatteryUsed;
				team.stats.mBatteryRestore= (team.stats.mBatteryRestore|0) + agent.stats.mBatteryRestore;
				team.stats.mBatteryRecharge= (team.stats.mBatteryRecharge|0) + agent.stats.mBatteryRecharge;
			}

			//in case of tied game the method to try to break the tie, in order, is:
			// +FinalScore
			// +TotalScore
			// +Holes
			// +Cells
			// -GoodMoves
			// -BadMoves
			// -BatteryUsed
			// -BatteryRestore
			// -BatteryRecharge
			$scope.trial.agents = SortAndPartition($scope.trial.agents).flattening();
			$scope.teams = SortAndPartition($scope.teams).flattening();

			$scope.close = function (){$modalInstance.dismiss()};
			$scope.setTableTeams = function(){
				$scope.orderdItems = $scope.teams;
				$scope.teamsTable = true;
			};
			($scope.setTableAgentPrograms = function(){
				$scope.orderdItems = $scope.trial.agents;
				$scope.teamsTable = false;
			})();

			$scope.showTeams = function(){
				return	$scope.task_env.prop.multiagent &&
						$scope.task_env.prop.multiagent_type == 2;
			}
		}

		this.open = function(){$location.url('/trials/view/'+_selected)}

	}]);

})();
