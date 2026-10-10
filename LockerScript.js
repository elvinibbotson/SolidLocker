function id(el) {
	return document.getElementById(el);
}
'use strict';
// GLOBAL VARIABLES	
var items=[];
var item=null;
var categories=[];
var category=null;
var itemIndex=0;
var listItems=[];
var listItem=null;
var currentDialog=null;
var pin='';
var keyCode=null;
var dragStart={};
var latest;
// solid session & authentication...
const auth=solidClientAuthentication;
const session=auth.getDefaultSession();
// DRAG TO RETURN TO CATEGORY LIST
id('main').addEventListener('touchstart', function(event) {
    // console.log(event.changedTouches.length+" touches");
    dragStart.x=event.changedTouches[0].clientX;
    dragStart.y=event.changedTouches[0].clientY;
})
id('main').addEventListener('touchend', function(event) {
    var drag={};
    drag.x=dragStart.x-event.changedTouches[0].clientX;
    drag.y=dragStart.y-event.changedTouches[0].clientY;
    if(Math.abs(drag.y)>50) return; // ignore vertical drags
    if((drag.x<-50)&&category) {
        category=null;
        listCategories();
    }
    // else if((drag.x>50)&&(currentDialog)) showDialog(currentDialog,false); // drag left to close dialogs
})
// TAP ON HEADER
id('buttonSync').addEventListener('click',connect);
// CLOSE DIALOG
id('curtain').addEventListener('click',function() {
	showDialog(currentDialog,false);
})
// SHOW/HIDE DIALOG
function showDialog(dialog,show) {
    console.log('show '+dialog+': '+show);
    if(currentDialog) id(currentDialog).style.display='none';
    if(show) {
        id(dialog).style.display='block';
        currentDialog=dialog;
        id('buttonNew').style.display='none';
        id('curtain').style.height='100%';
    }
    else {
        id(dialog).style.display='none';
        currentDialog=null;
        id('buttonNew').style.display='block';
        id('curtain').style.height='0';
    }
}
// NEW CATEGORY/NOTE
id('buttonNew').addEventListener('click', function(){
	item={};
    if(category==null) { // add new category
    	id('categoryField').value='';
    	id('addCategoryButton').style.display='block';
        showDialog('categoryDialog',true);
    }
    else { // add note
    	id('noteField').value='';
    	id('deleteNoteButton').style.display='none';
    	id('addNoteButton').style.display='block';
    	id('saveNoteButton').style.display='none';
        showDialog('noteDialog',true);
    }
})
id('addCategoryButton').addEventListener('click',function() {
	category=id('categoryField').value;
	if(category.length<1) return; // no category name
	if(categories.indexOf('category')>=0) return; // category already exists
	list.innerHTML='';
	id('header').innerText=category;
	showDialog('categoryDialog',false);
	console.log('new category - '+category);
})
id('addNoteButton').addEventListener('click', function() {
	console.log('add note '+id('noteField').value);
    item={};
    item.category=category;
    item.text=cryptify(id('noteField').value,keyCode);
    console.log('encrypted to '+item.text);
    items.push(item);
    save(); // WAS saveData();
    itemIndex=null;
    showDialog('noteDialog',false);
    listCategoryItems();
    console.log('note added');
})
// EDIT NOTE
id('saveNoteButton').addEventListener('click', function() {
	console.log('update item '+itemIndex);
	itemIndex=listItems[itemIndex].index;
	console.log('ie. item '+itemIndex);
	item={};
    item.category=category;
    item.text=cryptify(id('noteField').value,keyCode);
    console.log("encrypted note: "+item.text);
    items[itemIndex]=item;
    save(); // WAS saveData();
    console.log('note updated');
    showDialog('noteDialog',false);
    listCategoryItems();
})
id('deleteNoteButton').addEventListener('click', function() {
	console.log('delete item '+itemIndex);
	itemIndex=listItems[itemIndex].index;
	console.log('ie. item '+itemIndex);
    items.splice(itemIndex,1);
    save(); // WAS saveData();
    console.log("delete complete");
    showDialog('noteDialog',false);
    listCategoryItems();
    itemIndex=null;
})
// LIST CATEGORIES
function listCategories() {
	console.log('list '+categories.length+' categories');
	listItem;
	id("list").innerHTML=""; // clear list
	categories.sort(function(a,b){ // sort alphabetically
		if(a.toUpperCase()<b.toUpperCase()) return -1;
		if(a.toUpperCase()>b.toUpperCase()) return 1;
		return 0;
	});
	for(var i in categories) {
		console.log('list '+categories[i]);
		listItem=document.createElement('li');
		listItem.index=i;
		listItem.innerText=categories[i];
		listItem.addEventListener('click',function() {
			itemIndex=this.index;
			console.log('open item '+itemIndex);
			category=categories[this.index];
			console.log('list category '+categories[this.index]);
			listCategoryItems();
		});
		listItem.style.fontWeight='bold'; // lists are bold
		id('list').appendChild(listItem);
	}
	id('heading').innerText='SolidLocker';
}
// LIST ITEMS IN CATEGORY
function listCategoryItems() {
	console.log('list items in category '+category);
	listItems=[];
	id("list").innerHTML=""; // clear list
	for(var i in items) {
		console.log('item '+i+' category: '+items[i].category);
		if(items[i].category==category) {
			listItem={};
			listItem.index=i;
			listItem.text=cryptify(items[i].text,keyCode);
			listItems.push(listItem);
		}
	}
	listItems.sort(function(a,b){ // sort alphabetically
		if(a.text.toUpperCase()<b.text.toUpperCase()) return -1;
		if(a.text.toUpperCase()>b.text.toUpperCase()) return 1;
		return 0;
	});
	for(i in listItems) {
		console.log('list '+listItems[i].text);
		listItem=document.createElement('li');
		listItem.index=i;
		listItem.innerText=listItems[i].text;
		listItem.addEventListener('click',function() {
			itemIndex=this.index;
			item=listItems[this.index];
			console.log('edit note '+i+': '+item.text);
			id('noteField').value=item.text;
			id('deleteNoteButton').style.display='block';
			id('addNoteButton').style.display='none';
			id('saveNoteButton').style.display='block';
			showDialog('noteDialog',true);
		});
		id('list').appendChild(listItem);
	}
	id('heading').innerText=category;
}
// DATA
function load() {
	var data=localStorage.getItem('LockerData');
	if(!data) {
		message('No data - restore from backup?');
		return;
	}
	console.log('data: '+data.length+' bytes');
    items=JSON.parse(data);
    console.log(items.length+' items');
	categories=[];
	for(var i in items) {
		console.log('item '+i+': '+items[i].text+'; category: '+items[i].category);
		if(categories.indexOf(items[i].category)<0) categories.push(items[i].category);
	}
	console.log(items.length+' items loaded; '+categories.length+' categories');
	category=null;
	listCategories();
}
function save() {
	var data=JSON.stringify(items);
	window.localStorage.setItem('LockerData',data);
	window.localStorage.setItem('latest',new Date().toString());
	console.log('data saved to LockerData');
}
// SOLID
function connect() {
	console.log('CONNECT - logging in');
	try {
		auth.login({
    		oidcIssuer:"https://privatedatapod.com",
    		redirectUrl:window.location.href,
    		clientName:"SolidLocker"
    	});
	}
	catch(error) {console.error(error.message);}
}
auth.handleIncomingRedirect({restorePreviousSession:true}).then(function(){
	if(session.info.isLoggedIn) {
		console.log('logged in as '+session.info.webId);
		sync();
	}
});
async function sync() {
	if(!session.info.isLoggedIn) {connect(); return;} // ensure connected
	latest=window.localStorage.getItem('latest');
	console.log('latest is '+latest);
	message('SYNC - DOWNLOAD?',true);
	var response=await session.fetch('https://elvinibbotson.privatedatapod.com/drive/SolidLockerData.json',
	{ // ONLY RESTORE DATA FROM POD IF NEWER THAN CURRENT LOCAL DATA
		method: 'GET',
		headers: {'If-Modified-Since':latest}
	});
	console.log('response: '+response.json);
	if(response.ok) {
		var body=await response.json();
		console.log('response - last modified: '+response.lastModified);
		items=body.items;
		save();
		message(items.length+' items downloaded',false);
	}
	else { // local data is newer - upload to pod
		message('|no download - UPLOAD',false);
		upload();
	}
	latest=new Date().toString();
	window.localStorage.setItem('latest',latest);
	console.log('latest set to '+latest);
	load(); // ensure working with latest dataset
}
async function upload() {
	if(!session.info.isLoggedIn) {connect(); return;} // ensure connected
  	console.log("BACKUP");
	var fileName="drive/SolidLockerData.json";
	console.log(items.length+" items - save");
	var data={'items': items};
	var json=JSON.stringify(data);
	try {
		response=await session.fetch('https://elvinibbotson.privatedatapod.com/'+fileName,{
			method:'PUT',
			headers:{'Content-Type':'application/json'},
			body:json
		});
		if(!response.ok) {
    		throw new Error(`Response status: ${response.status}`);
    	}
    	console.log('backup saved, status: '+response.status);
    	message(items.length+' items saved');
	}
	catch (error) {console.error(error.message);alert(error.message);}
}
// DISPLAY MESSAGE
function message(text) {
	id('message').innerText=text;
	showDialog('messageDialog',true);
}
// ENCRYPT/DECRYPT TEXT USING KEY
function cryptify(value,key) {
	var i=0;
	var result="";
	var k;
	var v;
	for (i=0;i<value.length;i++) {
		k=key.charCodeAt(i%key.length);
		v=value.charCodeAt(i);
		result+=String.fromCharCode(k ^ v);
	}
	return result;
};
// KEY CHECK
function tapKey(n) {
	if(n=='<') {
		console.log('BACKSPACE');
		var l=pin.length;
		if(l>0) pin=pin.substr(0,l-1);
		console.log('pin: '+pin);
		id('pinField').innerHTML='';
		while(l>1) {
			id('pinField').innerHTML+='*';
			l--;
		}
		return false;
	}
	pin+=n;
	id('pinField').innerHTML+='*';
	console.log('pin: '+pin);
	if(pin.length>3) { // 4 digits entered
		console.log("keyCode: "+keyCode);
		console.log("check: "+id('keyCheck').value);
		if(keyCode===null) { // set keyCode - step 1
			keyCode=pin;
			id('keyCheck').value=pin;
			id('pinField').innerText='';
			pin='';
			id('keyTitle').innerText='confirm PIN';
        	return;
    	}
    	else if(pin==id('keyCheck').value) { // set keyCode step 2 or unlock
        	window.localStorage.keyCode=cryptify(pin,'secrets');
        	// unlocked=true;
        	showDialog('keyDialog',false);
        	// listCategories();
        	
        	
        	load();
        	if(session.info.isLoggedIn) sync(); // initial sync
        	
        	return true;
    	}
    	else {
    		id('pinField').innerText='';
			pin='';
    	}
	}
}

// PIN OK - CARRY ON
function go() {
	load();
	if(session.info.isLoggedIn) sync(); // initial sync
}

// START-UP CODE
keyCode=window.localStorage.keyCode; // load any saved key
console.log("saved key: "+keyCode);
if(!keyCode) { // first use - set a PIN
	console.log('set new PIN');
    keyCode=null;
    id('keyTitle').innerText='set a PIN';
    id('pinField').innerText='';
    pin='';
    showDialog('keyDialog',true);
}
else { // start-up - enter PIN
	console.log('encrypted keyCode: '+keyCode);
	keyCode=cryptify(keyCode,'secrets'); // saved key was encrypted
	console.log("decoded keyCode: "+keyCode);
	id('keyTitle').innerText='PIN';
	id('pinField').innerText='';
	pin='';
    id('keyCheck').value=keyCode;
    showDialog('keyDialog',true);
}
latest=window.localStorage.getItem('latest');
if(!latest) {
	latest=new Date(0).toString(); // default to 1970
	window.localStorage.setItem('latest',latest);
}
console.log('latest change: '+latest);




/*
load();

// TRY THIS AT START...
if(session.info.isLoggedIn) sync(); // initial sync
*/


// implement service worker if browser is PWA friendly
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
}
else { //Register the ServiceWorker
	navigator.serviceWorker.register('sw.js', {
		scope: '/SolidLocker/'
	}).then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}