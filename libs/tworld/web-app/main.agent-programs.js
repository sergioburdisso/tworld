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

(function(){
	var mod = angular.module('tworldAgentPrograms', []);

	var formats = []; for (p in _PERCEPT_FORMAT) formats.push(p);

	mod.controller("AgentProgController", ['$scope', '$rootScope', '$location', '$modal', 'agentProgs',
		function($scope, $rootScope, $location, $modal, agentProgs){
		var _self = this;
		var _selected = -1;

		this.agentPrograms = agentProgs;
		this.orderCond = "-date";
		this.allProps = true;
		this.page = 1;
		this.itemsPerPage = 10;
		this.query = {
			name:"",
			ai:true,
			javascript:true,
			keyboard:true
		};

		this.setSelected = function(value){_selected = value}
		this.isSelected = function(value){return _selected == value}

		this.remove = function(){
			$modal.open({
				size: 'sm',
				templateUrl: 'yes-no-modal.html',
				controller: yesNoModalController,
				resolve:{
					title: function(){return 'Confirmation'}, 
					msg: function(){return 'Are you sure you want to delete this agent program?'}
				}
			})
			.result.then(function(){
				if (!isLoggedIn())
					removeRetry(emptyTrialsAgentProgram(_selected))
				else
					emptyTrialsAgentProgram(_selected, removeRetry, $rootScope);
			});
		}

		this.download = function(date){downloadAgentProgramSourceCode(date, $rootScope)};

		this.open = function(){$location.url('/agent-programs/view:'+_selected)}

		this.run = function(jsap){
			if (jsap&&_self.editor(jsap)){
				$location.url('/agent-programs/source-code:'+jsap.date);
				gotoTop();
			}else{
				modalInstance = $modal.open({
					size: 'lg',//size,
					templateUrl: 'items-list-modal.html',
					controller: itemsListController,
					resolve:{
						items: itemsListEnvsResolver,
						agentProgramsFlag:function(){return false}
					}
				}).result.then(
					function (taskEnv) {
						$modal.open({
							size: 'lg',//size,
							templateUrl: 'run-modal.html',
							controller: runModalController,
							resolve:{
								taskEnv		: function (){ return taskEnv },
								agentProgs	: function($q) {
									if (!isLoggedIn()) return [getAgentProgramByDate(_selected)];
									else{
										var deferred = $q.defer();
										getAgentProgramByDate(
											_selected,
											function(response){ deferred.resolve([response]) },
											$rootScope
										);
										return deferred.promise;
									}
								}
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

		function removeRetry(emptyTrials){
			if (emptyTrials)
				remove()
			else{
				$modal.open({
					size: 'sm',
					templateUrl: 'yes-no-modal.html',
					controller: yesNoModalController,
					resolve:{
						title: function(){return 'Confirmation'}, 
						msg: function(){return 'It seems like there are trials/states associate with this agent programs. If you delete it, all its trials and stats will be deleted as well. Are you sure you want to proceed?'}
					}
				}).result.then(remove)
			}
		}


		function remove(){
			if (!isLoggedIn())
				_self.agentPrograms = removeAgentProgramByDate(_selected);
			else
				removeAgentProgramByDate(_selected, function(agentProgs){ _self.agentPrograms = agentProgs; $scope.$apply();}, $rootScope);
		}
	}]);

	mod.controller('AgentProgSourceCodeController', ['$rootScope','$scope','$routeParams','$modal', '$location', 'agentProg',
		function($rootScope, $scope, $routeParams, $modal, $location, agentProg){if (!agentProg || !agentProg.ai || !agentProg.javascript){$location.url('/');return}
			var _self = this;
			var _source;
			var _editor;

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
			this.dropdownopen = false;
			this.agent_prog = agentProg;
			

			if (!this.agent_prog.default_task_env)
				this.task_env =  undefined;
			else
				loadEnvAsync(this.agent_prog.default_task_env);

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
				this.dropdownopen = false;
				_source.cursor = _editor.getCursorPosition();
				_source.code = _editor.getValue();

				if (!isLoggedIn())
					updateAgentProgram(_self.agent_prog);
				else
					updateAgentProgram(_self.agent_prog, function(){$scope.$apply();}, $rootScope);

				_self.saved = true;
			}

			this.run = function(){
				this.dropdownopen = false;
				if (!this.task_env)
					this.openEnvironmentsModal(true);
				else
					this.openRunModal();
			}

			this.toggleMaximaze = function(){
				_self.fullScreen = !_self.fullScreen;
				if (_self.fullScreen){
					_editor.setOptions({autoScrollEditorIntoView: false});
					$(window).scrollTop(0).css("overflow","hidden");
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
					resolve: {
						items: itemsListEnvsResolver,
						agentProgramsFlag: function(){return false}
					}
				})
				.result.then(
					function (taskEnv) {
						_self.agent_prog.default_task_env = taskEnv.date;
						if (!_self.task_env && run){
							_self.task_env = taskEnv;
							_self.openRunModal();
						}else
							_self.task_env = taskEnv;
					}
				);
			}

			this.openMemoryModal = function(){
				$modal.open({
					size: 'lg',//size,
					templateUrl: 'memory-modal.html',
					resolve:{
						memory: function($routeParams, $q){
							if (!isLoggedIn())
								return JSON.stringify(getMemoryByAgentProgramDate($routeParams.id));
							else{
								var deferred = $q.defer();
								getMemoryByAgentProgramDate(
									$routeParams.id,
									function(memory){
										deferred.resolve( memory?JSON.stringify(memory):'' )
									},
									$rootScope
								);
								return deferred.promise;
							}
						}
					},
					controller: function($scope, $modalInstance, memory){
						$scope.memory = {text: memory};
						$scope.alert = false;
						$scope.hideAlert = function(){$scope.alert = false}
						$scope.save = function(){
							try{
								JSON.parse($scope.memory.text); //is it a well-formed JSON string?
								if (!isLoggedIn()){
									saveMemoryByAgentProgramDate($routeParams.id, $scope.memory.text);
									$modalInstance.close();
								}else
									saveMemoryByAgentProgramDate(
										$routeParams.id,
										$scope.memory.text,
										$modalInstance.close,
										$rootScope
									);
							}catch(e){$scope.alert = true}
						}
						$scope.close = function(){$modalInstance.dismiss()}

						//to handle TABs properly
						$(document).delegate('#memory', 'keydown', function(e) {
							var keyCode = e.keyCode || e.which;

							if (keyCode == 9) {
								e.preventDefault();
								var start = $(this).get(0).selectionStart;
								var end = $(this).get(0).selectionEnd;

								// set textarea value to: text before caret + tab + text after caret
								$(this).val($(this).val().substring(0, start)
										+ "\t"
										+ $(this).val().substring(end));

								// put caret at right position again
								$(this).get(0).selectionStart =
								$(this).get(0).selectionEnd = start + 1;
							}
						});
					}
				})
			}

			this.openRunModal = function(){
				_self.save();
				$modal.open({
						size: 'lg',//size,
						templateUrl: 'run-modal.html',
						controller: runModalController,
						resolve:{
							taskEnv: _self.task_env?
										function(){return _self.task_env}
										:
										function ($rootScope, $q){
											return runTaskEnvResolver(
												_self.agent_prog.default_task_env,
												$rootScope,
												$q
											)
										},
							agentProgs: function(){return [_self.agent_prog]}
						}
					});
			}

			function loadEnvAsync(date){
				if (!isLoggedIn())
					_self.task_env = getEnvironmentByDate(date);
				else{
					getEnvironmentByDate(date,function(response){_self.task_env = response;$scope.$apply();},$rootScope);
					_self.task_env = {date: date, name: "Loading..."};
				}
			}
			//constructor logic

			_editor.on('input', function() {
				if (_self.saved){
					_self.saved = false;
					$scope.$apply()//update the binding values
				}
			});

			$(window).unbind('keydown').bind('keydown', function(event) {
				if (event.ctrlKey || event.metaKey) {
					switch (String.fromCharCode(event.which).toLowerCase()) {
					case 's':
						event.preventDefault();
						_self.save();
						$scope.$apply();
						break;
					case 'f':
						//event.preventDefault();
						break;
					case 'g':
						//event.preventDefault();
						break;
					case 'r':
						event.preventDefault();
						_self.run();
						break;
					}
				}
			});

		}]
	);

	mod.controller('AgentProgNewController', ['$scope', '$rootScope', '$modal', '$location', 'agentProg',
		function($scope, $rootScope, $modal, $location, agentProg){if (!agentProg){$location.url('/');return}
			var _self = this;
			var _socket = agentProg.socket;

			this.gett = gettt;

			this.PERCEPT_FORMAT = _PERCEPT_FORMAT;

			this.perceptFormats = formats;
			this.agent_prog = agentProg;
			this.isLoggedIn = isLoggedIn;

			this.save = function(){if (Validate()){
				agentProg.source.file = $("#file").val() != "";

				if (!agentProg.source.file){
					if (!agentProg.date)
						newAgentProgram(this.agent_prog, _finished, $rootScope);
					else
						updateAgentProgram(agentProg, _finished, $rootScope);
				}else{
					sendToTCloudWithFile(
						{
							nm: !agentProg.date? 'new_agent_program' : 'update_agent_program',
							m: 'user_file_uploader',
							date: (agentProg.date = !agentProg.date? Date.now() : agentProg.date),
							ap: JSON.stringify(agentProg)
						},
						$('#file')[0].files[0],
						_finished,
						$rootScope
					);
				}
			}}

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

			function _finished(){
				_socket.magic_string_dirty = (_socket.magic_string != _self.agent_prog.name);

				if (_self.agent_prog.javascript && _self.agent_prog.ai)
					$location.url('/agent-programs/source-code:'+_self.agent_prog.date)
				else
					$location.url('/');

				$scope.$apply(); // update current url

				gotoTop();
			}
	}]);

	mod.filter('keyboard_key', function() {
		return function(input) {return _KEYBOAR_MAP[input]}
	});

})();
