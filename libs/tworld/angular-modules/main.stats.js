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

	mod.controller("StatsController", ["$location", "$modal", function($location, $modal){
		var _self = this;
		var _selected = -1;

		this.agentPrograms = agentPrograms;
		this.orderCond = "-date";
		this.allProps = true;
		this.query = {
			name:"",
			ai:true,
			javascript:true,
			keyboard:true
		};

		this.setSelected = function(value){_selected = value}
		this.isSelected = function(value){return _selected == value}

		this.remove = function(){
			for (var t=agentPrograms.length; t--;)
				if (agentPrograms[t].date == _selected)
					agentPrograms.remove(t);
			saveAgentPrograms();
		}

		this.open = function(){$location.url('/agent-programs/view/'+_selected)}

		this.run = function(){
			var modalInstance = $modal.open({
						size: 'lg',//size,
						templateUrl: 'items-list-modal.html',
						controller: itemsListController,
						resolve:{
							items:function(){return taskEnvironments},
							agentProgramsFlag:function(){return false}
						}
					});

			modalInstance.result.then(
				function (id) {
					$modal.open({
						size: 'lg',//size,
						templateUrl: 'run-modal.html',
						controller: runModalController,
						resolve:{
							taskEnv: function(){return getEnvironmentByDate(id)}, 
							agentProgs: function(){return [getAgentProgramByDate(_selected)]}
						}
					});
				}
			);
		}

		this.editor = function(agent_prog){return (agent_prog && agent_prog.ai && agent_prog.javascript)}

		this.userFilter = function(agentProg){
			var regEx = new RegExp(_self.query.name,"i");
			var q = _self.query;
			return regEx.test(agentProg.name) && (
					_self.allProps ||
					(
						q.ai == agentProg.ai && (
							(q.ai && q.javascript == agentProg.javascript)
							||
							(!q.ai && q.keyboard == agentProg.keyboard)
						)
					)
			);
		}

	}]);

})();
