/*
* main.environments.js - 
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
	var mod = angular.module("tworldEnvironments", []);

	mod.controller("EnvController", function(){
		var _self = this;
		var _selected = -1;

		this.taskEnvironments = taskEnvironments;
		this.orderCond = "-date";
		this.allProps = true;
		this.query = {
			name:"",
			battery: false,
			prop: {
				fullyObservable: true,
				multiagent: false,
				deterministic: true,
				dynamic: 0, //0 static; 1 semidynamic; 2 dynamic
				known: true
			}
		};

		this.setSelected = function(value){_selected = value}
		this.isSelected = function(value){return _selected == value}

		this.testIt = function(){
			var env = getEnvironmentByDate(_selected);
			env.trial.test = true;
			saveKnobs(env);

			startTWorld()
		}

		this.userFilter = function(task_env){
			var regEx = new RegExp(_self.query.name,"i");
			var p = _self.query.prop;
			return regEx.test(task_env.name) && (
					_self.allProps ||
					(
						_self.query.battery == task_env.battery &&
						p.fullyObservable == task_env.prop.fullyObservable &&
						p.multiagent == task_env.prop.multiagent &&
						p.deterministic == task_env.prop.deterministic &&
						p.dynamic == task_env.prop.dynamic &&
						p.known == task_env.prop.known
					)
			);
		}

	});

})();