/*
* main.support.js - 
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
  var mod = angular.module('tworldSupport', []);

  mod.controller("SupportController", ['$scope', '$rootScope', '$location',
    function($scope, $rootScope, $location){
      var _self = this;
      var _selected = 0;

      this.setThesisTab = function(){_selected = 0}
      this.isThesisTab = function(value){return _selected == 0}

      this.setPapersTab = function(){_selected = 1}
      this.isPapersTab = function(value){return _selected == 1}

      this.setPostersTab = function(){_selected = 2}
      this.isPostersTab = function(value){return _selected == 2}

      this.setForumTab = function(){_selected = 3}
      this.isForumTab = function(value){return _selected == 3}
    }
  ]);

})();
