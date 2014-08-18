/*
* main.agent-programs.js - 
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
var _editor;
(function(){
	var mod = angular.module('tworldAgentPrograms', []);

	var formats = []; for (p in _PERCEPT_FORMAT) formats.push(p);

	mod.controller("AgentProgController", ["$location", "$modal", function($location, $modal){
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

		this.run = function(jsap){
			if (jsap&&_self.editor(jsap)){
				$location.url('/agent-programs/source-code/'+jsap.date);
				gotoTop();
			}else{
				modalInstance = $modal.open({
					size: 'lg',//size,
					templateUrl: 'items-list-modal.html',
					controller: itemsListController,
					resolve:{
						items:function(){return taskEnvironments},
						agentProgramsFlag:function(){return false}
					}
				}).result.then(
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

	mod.controller('AgentProgSourceCodeController', ['$scope','$routeParams','$modal', '$location',
		function($scope, $routeParams, $modal, $location){
			var _self = this;
			var _source;
			//var _editor;

			ace.require("ace/ext/language_tools");
			_editor = ace.edit("source-code");

			_editor.setOptions({
				theme: "ace/theme/ambiance",
				enableBasicAutocompletion: true,
				enableLiveAutocompletion: false,
				enableSnippets: true,
				cursorStyle: "smooth",
				autoScrollEditorIntoView: true,
				animatedScroll: true,
				showInvisibles: true,
				displayIndentGuides: true,
				showPrintMargin: true,
				mode:"ace/mode/javascript",
				useWorker: true,
				useSoftTabs:true,
				tabSize:2
			});

			this.fullScreen = false;
			this.saved = true;
			this.agent_prog = getAgentProgramByDate($routeParams.id);
			if (!this.agent_prog.ai || !this.agent_prog.javascript){$location.url('/404');return}

			this.task_env = this.agent_prog.default_task_env?
								getEnvironmentByDate(this.agent_prog.default_task_env)
								:
								null;

			this.open = function(source){
				if (_source){
					_source.cursor = _editor.getCursorPosition();
					_source.code = _editor.getValue();
				}

				_source = source;

				_editor.setValue(_source.code);
				_editor.focus();
				_editor.gotoLine(_source.cursor.row+1, _source.cursor.column, true);
				_editor.scrollToRow(_source.cursor.row);
			}

			this.save = function(){
				_source.cursor = _editor.getCursorPosition();
				_source.code = _editor.getValue();

				_self.saved = true;

				saveAgentPrograms()
			}

			this.run = function(){
				this.save();
				if (!this.task_env)
					this.openEnvironmentsModal(true);
				else
					this.openRunModal();
			}

			this.toggleFullScreen = function(){
				_self.fullScreen = !_self.fullScreen;
				if (_self.fullScreen){
					_editor.setOptions({autoScrollEditorIntoView: false});
					$('body').scrollTop(0).css("overflow","hidden");
					$('#source-code').css("height", $(window).height()-100+"px")
				}else{
					_editor.setOptions({autoScrollEditorIntoView: true});
					$('#source-code').css("height", "")
					$('body').css("overflow","initial");
					gotoTop()
				}
				_editor.resize();
			}

			this.openEnvironmentsModal = function(run){
				$modal.open({
					size: 'lg',//size,
					templateUrl: 'items-list-modal.html',
					controller: itemsListController,
					resolve:{
						items:function(){return taskEnvironments},
						agentProgramsFlag:function(){return false}
					}
				})
				.result.then(
					function (id) {
						if (!_self.task_env && run){
							_self.task_env = getEnvironmentByDate(id);
							_self.openRunModal();
						}else
							_self.task_env = getEnvironmentByDate(id);

						_self.agent_prog.default_task_env = id;
					}
				);
			}

			this.openRunModal = function(){
				$modal.open({
						size: 'lg',//size,
						templateUrl: 'run-modal.html',
						controller: runModalController,
						resolve:{
							taskEnv: function(){return _self.task_env}, 
							agentProgs: function(){return [_self.agent_prog]}
						}
					});
			}

			//constructor logic

			_editor.on('input', function() {
				if (_self.saved){
					_self.saved = false;
					$scope.$apply()//update the binding values
				}
			});

		}]
	);

	mod.controller('AgentProgNewController', ['$modal', '$location', 'agentProg',
		function($modal, $location, agentProg){
			var _self = this;
			var _socket = agentProg.socket;

			this.PERCEPT_FORMAT = _PERCEPT_FORMAT;

			this.perceptFormats = formats;
			this.agent_prog = agentProg;

			this.save = function(){
				var _newFlag = !agentProg.date;

				if (_newFlag){
					agentProg.date = Date.now();
					agentPrograms.push(this.agent_prog);
				}else
					agentPrograms[ getAgentProgramIndexByDate(agentProg.date) ] = agentProg;

				_socket.magic_string_dirty = _socket.magic_string != this.agent_prog.name;

				saveAgentPrograms();
				if (this.agent_prog.javascript && this.agent_prog.ai && _newFlag)
					$location.url('/agent-programs/source-code/'+this.agent_prog.date)
				else
					$location.url('/');

				gotoTop();
			}

			this.readKey = function(key){
				$modal.open({
					size: 'sm',//size,
					templateUrl: 'read-key.html',
					controller: readKeyController
				})
				.result.then(
					function (keyCode) {
						if (!keyCode) return;
						agentProg.controls[key] = keyCode;
					},
					function(){$(document).unbind('keydown')}
				);
			}

			this.nameUpdate = function(){
				if (!_socket.magic_string_dirty && $("#magic-string").hasClass("ng-pristine"))
					_socket.magic_string = this.agent_prog.name;
			}
	}]);

	mod.filter('keyboard_key', function() {
		return function(input) {return _KEYBOAR_MAP[input]}
	});

})();
