/*
* main.menu.js - 
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
	var mod = angular.module("tworldMainMenu", []);

	mod.controller("MainMenuController", ["$modal", function($modal){
		var _self = this;

		this.menu = -1;
		this.overStart = false;

		this.leave = function(){this.menu = -1}
		this.setActive = function(i){this.menu = i}
		this.isActive = function(i){return this.menu === i}

		this.viewSettings = function(){
			$modal.open({
				templateUrl: 'settings-modal.html',
				controller: settingsModalController
			})
		}

		this.startTWorld = function(){
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
				function (taskEnv) {if (taskEnv){
					$modal.open({
						size: 'lg',
						templateUrl: 'run-modal.html',
						controller: runModalController,
						resolve:{
							taskEnv:  function (){ return taskEnv }, 
							agentProgs: function(){return []}
						}
					});
				}}
			);
		}
	}])

})();