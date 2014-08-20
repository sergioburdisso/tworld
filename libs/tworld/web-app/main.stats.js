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

	mod.controller('StatsController', ['$location', '$routeParams', '$modal',
	function($location, $routeParams, $modal){
		var _self = this;
		var _selected = -1;
		var _trials = getTrials();

		if (!$routeParams.task_env_id)
			$routeParams.task_env_id = "all";
		if (!$routeParams.agent_prog_id)
			$routeParams.agent_prog_id = "all";

		this.task_env = $routeParams.task_env_id != "all"?
							getEnvironmentByDate($routeParams.task_env_id)
						:
							undefined;

		this.agent_prog = $routeParams.agent_prog_id != "all"?
							getAgentProgramByDate($routeParams.agent_prog_id)
						:
							undefined;

		this.orderCond = '-date';

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
						task_env_name: !this.task_env?
											getEnvironmentByDate(_trials[i].task_env_id).name
											:
											this.task_env.name,
						agent_progs: '',
						agent_progs_num: 0
					}

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
			agentProgramsTrials = getAgentProgramsTrials();
			taskEnvironmentTrials = getTaskEnvironmentTrials();
			_trials = getTrials();

			for (var t=_self.trials.length; t--;)
				if (_self.trials[t].date == _selected)
					_self.trials.remove(t);

			for (var t=_trials.length; t--;)
				if (_trials[t].date == _selected)
					_trials.remove(t);

			for (var t=agentProgramsTrials.length; t--;)
				if (agentProgramsTrials[t] == _selected)
					agentProgramsTrials.remove(t);

			for (var t=taskEnvironmentTrials.length; t--;)
				if (taskEnvironmentTrials[t] == _selected)
					taskEnvironmentTrials.remove(t);

			saveTrials(_trials, agentProgramsTrials, taskEnvironmentTrials);
		}

		this.selectTaskEnvironment = function(){
			$modal.open({
				size: 'lg',//size,
				templateUrl: 'items-list-modal.html',
				controller: itemsListController,
				resolve:{
					items:function(){return getEnvironments()},
					agentProgramsFlag:function(){return false}
				}
			})
			.result.then(
				function (task_env_id) {
					$location.url(
						'/stats/task-env:'+task_env_id+'&agent-prog:'+$routeParams.agent_prog_id
					);
					gotoTop()
				}
			);
		}

		this.selectAgentProgram = function(){
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
				function (agent_prog_id) {
					$location.url(
						'/stats/task-env:'+$routeParams.task_env_id+'&agent-prog:'+agent_prog_id
					);
					gotoTop()
				}
			);
		}

		this.open = function(){$location.url('/trials/view/'+_selected)}

	}]);

})();
