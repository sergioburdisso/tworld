/*
* solid-loader.js - 
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
var loadQueue = new Array();
function importScript(file, condition){ loadQueue.push(!condition? file : [file, condition]) }
function loadAllSync(){
	if (loadQueue.length > 0){
		var head=document.getElementsByTagName("head")[0];
		var script, file;

		file= loadQueue.shift(); // FIFO

		//if this file have conditions under which it has to be loaded
		// and they are satisfied, load the file... 
		if (!(file instanceof Array) || eval(file[1])){
			script= document.createElement('script');
			script.src= (file instanceof Array)? file[0] : file;
			script.type='text/javascript';

			try{//console guard
			console.clear();
			console.log("Loading modules... [" + script.src.substr(window.location.origin.length, script.src.length) + "]");}catch(e){
			}

			//real browsers
			script.onload= loadAllSync;
			script.onerror = function () {
				try{console.error("Error: couldn't download this file\n(if your Internet connection is slow, try reloading the page)");}catch(e){}
			}

			//Internet explorer XD
			script.onreadystatechange = function() {
				if (this.readyState == 'complete'){
					loadAllSync();
				}
			}
			head.appendChild(script);
		}else
		//...otherwise skip this file, and try loading the next one
			loadAllSync();
	}else
		try{console.clear();}catch(e){}
}

//-> Importing scripts synchronously
	importScript("./libs/jquery/jquery-1.7.2.min.js");
	importScript("./libs/jquery/jquery.mousewheel.js");
	importScript("./libs/jquery/jquery-ui.min.js");
	importScript("./libs/util/he.min.js");

	importScript("./libs/tworld/solid-auxiliary.js");

	importScript("./libs/tworld/solid-global.js");
	importScript("./libs/tworld/web-app/main.$global.storage.js");
	importScript("./libs/tworld/solid-general-settings.js");

	importScript(
		"./libs/util/xml2json.min.js",
		/*provided that the following conditions are satisfied*/
		"_XML_NECESSARY"
	);
	importScript("./libs/util/sprintf.min.js");
	importScript(
		"./libs/sound/buzz.min.js",
		/*provided that the following condition is satisfied*/
		"_AUDIO_ENABLE"
	);

	importScript("./copperlichtdata/copperlicht.js");

	importScript("./libs/tworld/solid-core.js");
	importScript("./libs/tworld/solid-environment.js");
	importScript("./libs/tworld/solid-graphic.js");
	importScript("./libs/tworld/solid-graphic-rob.js");

	loadAllSync();
//<-