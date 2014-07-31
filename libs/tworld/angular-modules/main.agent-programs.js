/*
* main.environments.new.js - 
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
	var mod = angular.module('tworldAgentPrograms', []);

	var formats = []; for (p in _PERCEPT_FORMAT) formats.push(p);

	mod.controller('AgentProgSourceCodeController', ['$routeParams','$location',
		function($routeParams, $location){
			this.task_env = null;
			this.agent_prog = getAgentProgramByDate($routeParams.id);
			if (!this.agent_prog){$location.url('/404');return}

			editor.setValue(this.agent_prog.source.code);
			editor.focus();
			editor.gotoLine(this.agent_prog.source.cursor.row+1, this.agent_prog.source.cursor.column, true);
			editor.scrollToRow(this.agent_prog.source.cursor.row);

			this.save = function(){
				this.agent_prog.source.cursor = editor.getCursorPosition();
				this.agent_prog.source.code = editor.getValue();
				saveAgentPrograms()
			}
		}]
	);

	mod.controller('AgentProgNewController', ['$location',
		function($location){
			var _self = this;

			this.perceptFormats = formats;
			this.agent_prog = {
				name:"",
				desc:"",
				date:0,
				ai: true,
				javascript:true,
				source:{
					code:"function AgentProgram(percept){\n\t\n}",
					cursor:{row:0, column:0}
				},
				keyboard:true,
				prop: {
					fullyObservable: true,
					multiagent: false,
					multiagent_type: 0, //0 competitive; 1 cooperative; 2 both
					deterministic: true,
					dynamic: 0, //0 static; 1 semidynamic; 2 dynamic
					known: true
				}
			}

			this.save = function(){
				this.agent_prog.date = Date.now();
				agentPrograms.push(this.agent_prog);
				saveAgentPrograms();
				if (this.agent_prog.javascript && this.agent_prog.ai)
					$location.url('/agent-programs/source-code/'+this.agent_prog.date)
				else
					$location.url('/')
			}
	}]);

})();
