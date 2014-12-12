
//TODO: cache emotes, only retrive new emotes from the server when the cached ones are a day(?) old
//      maybe when twitchemotes.com yells at me
//TODO: get an icon that's not copywritten? if twitch mentions it. i'm not making money off this so...

// some default settings
kappa = false;
globals = true;
subs = false;
bttv = false;
masterrace = false;

emote_dict = new Array();

// get settings -> run the program
chrome.storage.sync.get({
    kappa: false,
    globals: true,
    subs: false,
	bttv: false,
	masterrace: false,
},function(items) {
    kappa = items.kappa;
    globals = items.globals;
    subs = items.subs;
	bttv = items.bttv;
	masterrace = items.masterrace;
    replace_words();
});

function replace_words() {
    //"if there's no cached data" "or the data is a week old" "or if i goddamn tell you to remotely"
    if (kappa) {
        get_kappa();
    }
    if (globals) {
        get_globals();
    }
    if (subs) {
        get_subs();
    }
	if (bttv) {
		get_bttv();
	}
	if (masterrace) {
		get_masterrace();
	}
    //"else, get it from some sort of cache" <- chrome storage api? limits and size and type (can dicts be values? do i need to json stringify it? Will that fit in chrome storage?)
}

function doDFS(evt) {
	dfs(document.body);
}
document.addEventListener('replaceWords', doDFS, false);
document.addEventListener('DOMNodeInserted', dynamically_replace, false);

//emotes to ignore
ignoreEmotes = ['some'];
disallowedChars = ['\\', ':', '/', '&', '\'', '"', '?', '!', '#'];

//sub "emote" names to ignore
ignorelist = ['Win', 'Lose', 'GG', 'Kill', 'IMBA', 'CA', 'US', 'Pylon', 'Gosu', 'Fighting', 'Cheese', 'TW', 'KR','SG','NL','JP','HK','double','triple','SNIPE','SK', 'POISON','C9','inverse','Anubis','Fraud','COAST','ICEFROG', 'Ra', 'Apollo','Roshan']

dfsEvent = document.createEvent("Event");
dfsEvent.initEvent('replaceWords', true, true);
	
function containsDisallowedChar(word) {
	for(dis in disallowedChars)
		if(word.indexOf(dis) > -1)
			return true;
	return false;
}
	
function get_kappa() {
    emote_dict['Kappa'] = {url:'//static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-ddc6e3a8732cb50f-25x28.png'};
    document.dispatchEvent(dfsEvent);
    return emote_dict;
}

function get_globals() {
	var xhr = new XMLHttpRequest();
    xhr.open('GET', '//twitchemotes.com/global.json');
    xhr.send();
    xhr.onload = function() {
		emote_d = JSON.parse(xhr.responseText);
		for (var key in emote_d) {
			emote_dict[key] = {url:emote_d[key]['url']};
		}
		document.dispatchEvent(dfsEvent);
		return emote_dict;
    }
}

function get_subs() {
	var xhr = new XMLHttpRequest();
    xhr.open('GET', '//twitchemotes.com/subscriber.json');
    xhr.send();
    xhr.onload = function() {
		emote_d = JSON.parse(xhr.responseText);
		for (var key in emote_d) {
			for (var key2 in emote_d[key]['emotes']) {
				if (ignorelist.indexOf(key) == -1) {
					emote_dict[key2] = {url:emote_d[key]['emotes'][key2]};
				}
			}
		}
		document.dispatchEvent(dfsEvent);
		return emote_dict;
    }
}

function get_bttv() {
	var xhr = new XMLHttpRequest();
    xhr.open('GET', '//cdn.betterttv.net/emotes/emotes.json');
    xhr.send();
    xhr.onload = function() {
        emote_d = JSON.parse(xhr.responseText);
		for (var key in emote_d) {
			var word = emote_d[key]['regex'];
			if(!containsDisallowedChar(word) && ignoreEmotes.indexOf(word) == -1) {
				emote_dict[emote_d[key]['regex']] = {url:emote_d[key]['url']};
			}
		}
		document.dispatchEvent(dfsEvent);
		return emote_dict;
	}
}

function get_masterrace() {
    emote_dict['PCMR'] = {url:'//i.imgur.com/Zp9QNt8.png'};
	emote_dict['GabeN'] = {url:'//i.imgur.com/yDZTEaf.png'};
    document.dispatchEvent(dfsEvent);
    return emote_dict;
}

function dynamically_replace(evt) {
    var element2 = evt.target;
    //twitter hack solution
    if (element2 && element2.tagName && element2.tagName.toLowerCase() == 'div') {
        if (element2.parentElement.className.indexOf('tweet-box') > -1 || 
            element2.parentElement.className.indexOf('normalizer') > -1)
            return;
    }

    //OH GOD HOW DO I MAKE BOOLEAN LOGIC READABLE ON JAVASCRIPT PLEASE TO HELP
    if (element2 && (!element2.className || 
                    // if it's not a popup bubble on twitch chat (BTTV)
                    //maybe the worst code i've ever written? yah. oh well it works lol
                    ((element2.className && element2.className.indexOf && element2.className.indexOf('tipsy') == -1 || 
                      (location && location.hostname && location.hostname.indexOf && location.hostname.indexOf('twitch.tv') == -1)) &&
                    //ignore twitch chat lines
                     element2.className.indexOf && element2.className.indexOf('chat-line') == -1)
                )) {
        dfs(element2);
    }
}

function replace_text(element) {
    var value = element.nodeValue;
    if (value) {
        var parent_element = element.parentElement;
        var split = value.split(/\b/);
        var len = split.length;
        var buffer = '';
        var found = false;
        //this is actually a p. cool soln. it keeps a buffer of text to save and dynamically inserts and replaces text+emotes
        //For example, This is how this function would work on "Hey Kappa Kappa Hey Kappa Kappa Hey"
        //Read "Hey " -> replace "Kappa" -> read " " -> replace "Kappa" -> 
        //Read "Hey " -> replace "Kappa" -> read " " -> replace "Kappa" -> read " Hey"
        //Write the result to the DOM -> remove "Hey Kappa Kappa Hey Kappa Kappa Hey" from the DOM
        for (var i=0; i < len; i++) {
            word = split[i];
            if (word in emote_dict && emote_dict[word]['url'] != undefined) {
                found = true;
                img = document.createElement('img');
                //img.src = 'http:' + emote_dict[word]['url'];
                img.src = emote_dict[word]['url'];
                img.title = word;
                img.alt = word;
                img.style.display = 'inline';
                txt = document.createTextNode(buffer);
                parent_element.insertBefore(txt, element);
                parent_element.insertBefore(img, element);
                buffer = '';
            } else {
                buffer += word;
                if (i == len-1) {
                    if (buffer != element.nodeValue) {
                        txt = document.createTextNode(buffer);
                        parent_element.insertBefore(txt, element);
                        element.nodeValue = '';
                    }
                }
            }
        }
    } else { //if the node is the empty string or undefined or smth
        return;
    }
    //if we're replacing an emote at the end of a block, delete the text that was previously there
    if (buffer == '') {
        element.nodeValue = '';
    }
}

function dfs(element) {
    var child, next;
    switch(element.nodeType) {
        case 1: //switch cases are so readable. heh. i <3 u javascript.
        case 9:
        case 11:
            child = element.firstChild;
            while (child) {
                next = child.nextSibling;
                dfs(child);
                child = next;
            }
        case 3:
            replace_text(element);
            break
    }
}

