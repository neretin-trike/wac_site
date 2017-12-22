// создание блока набрать node block name
'use strict';

const fs = require('fs')
const path = require('path')
const colors = require('colors')
const readline = require('readline')

const rl = readline.createInterface(process.stdin, process.stdout);

// folder with all blocks
const BLOCKS_DIR = path.join(__dirname, 'app/blocks');

var dir = BLOCKS_DIR;

//////////////////////////////////////////////////////////////////////////////////////////////////

// default content for files in new block
const fileSources = {
	pug: `mixin {blockName}()\n\t.{blockName}\n\t\t| {blockName}\n`,
	less: `.{blockName} \{\n\tdisplay: block;\n}`,
	js	: `// .{blockName} scripts goes here`
};

function validateBlockName(blockName) {
	return new Promise((resolve, reject) => {
		const isValid = /^(\d|\w|-)+$/.test(blockName);

		if (isValid) {
			resolve(isValid);
		} else {
			const errMsg = (
				`ERR>>> An incorrect block name '${blockName}'\n` +
				`ERR>>> A block name must include letters, numbers & the minus symbol.`
			);
			reject(errMsg);
		}
	});
}

function directoryExist(blockPath, blockName) {
	return new Promise((resolve, reject) => {
		fs.stat(blockPath, notExist => {
			if (notExist) {
				resolve();
			} else {
				reject(`ERR>>> The block '${blockName}' already exists.`.red);
			}
		});
	});
}

function createDir(dirPath) {
	return new Promise((resolve, reject) => {
		fs.mkdir(dirPath, err => {
			if (err) {
				reject(`ERR>>> Failed to create a folder '${dirPath}'`.red);
			} else {
				resolve();
			}
		});
	});
}

function createFiles(blocksPath, blockName) {
	const promises = [];
	Object.keys(fileSources).forEach(ext => {
		const fileSource = fileSources[ext].replace(/\{blockName}/g, blockName);
		const filename = `${blockName}.${ext}`;
		const filePath = path.join(blocksPath, filename);

		promises.push(
				new Promise((resolve, reject) => {
					fs.writeFile(filePath, fileSource, 'utf8', err => {
						if (err) {
							reject(`ERR>>> Failed to create a file '${filePath}'`.red);
						} else {
							resolve();
						}
					});
				})
		);
	});

	return Promise.all(promises);
}

function getFiles(blockPath) {
	return new Promise((resolve, reject) => {
		fs.readdir(blockPath, (err, files) => {
			if (err) {
				reject(`ERR>>> Failed to get a file list from a folder '${blockPath}'`);
			} else {
				resolve(files);
			}
		});
	});
}

function printErrorMessage(errText) {
	console.log(errText);
	rl.close();
}


// //////////////////////////////////////////////////////////////////////////

function initMakeBlock(blockName) {
	const blockPath = dir;//path.join(dir, blockName);

	return validateBlockName(blockName)
		.then(() => directoryExist(blockPath, blockName))
		.then(() => createDir(blockPath))
		.then(() => createFiles(blockPath, blockName))
		.then(() => getFiles(blockPath))
		.then(files => { 
			const line = '-'.repeat(48 + blockName.length);
			console.log(line);
			console.log(`The block has just been created in 'app/blocks/${blockName}'`);
			console.log(line);

			// Displays a list of files created
			files.forEach(file => console.log(file.yellow));

			rl.close();
		});
}


// //////////////////////////////////////////////////////////////////////////
//
// Start here
//

// Command line arguments
const blockNameFromCli = process.argv
		// join all arguments to one string (to simplify the capture user input errors)
		.slice(2)
		.join(' ');

//block>(block2>block21+block22)+block3
// b>b2>b21+b22+b23
// b>b1+b2>b21>b211+b212+b213

console.log('-------------');


var urls = [];
		
function getCloseBrkIndx(str){
	for (var i = str.length; i>0; i--){
		if (str[i]==')')
			return i;
	}
}

function replaceAt(string, index, replace) {
	return string.substring(0, index) + replace + string.substring(index + 1);
}


function recurse(name, url = '',hyphen = ''){
	var bro = [];

	var posAncestor = name.indexOf('>');
	var posDescendant = name.indexOf('+');

	if ( ((posAncestor!= -1) && (posAncestor < posDescendant))  || (posDescendant ==-1)){

		var roots = name.slice(0,posAncestor);
		var remain = name.slice(posAncestor+1, name.length);

		if (posAncestor != -1){
			hyphen += '— ';
			
			console.log(hyphen+roots);

			url = url + '/' + roots;
			urls.push(url);
			console.log('··············');
			recurse(remain,url,hyphen);
		}
		if (posAncestor == -1){
			hyphen += '— ';
			
			console.log(hyphen +remain);
			
			url = url + '/' + remain;
			urls.push(url);
			console.log('··············');

		}
	}
	else{
		if (name.indexOf('+') != -1){

			if (posAncestor == -1){
				bro = name.split('+');
				
				bro.forEach(element => {
					recurse(element,url,hyphen);
				});
			}
			else{
				var roots = name.slice(0,posDescendant);
				var remain = name.slice(posDescendant+1, name.length);

				bro[0] = roots;
				bro[1] = remain;

				var a = 0;

				var open = "(";
				var openArr = [];
				var close = ")";
				var closeArr = [];
				var ances = ">";
				var ancesArr = [];

				for (var i = 0; i<remain.length; i++){
					if (remain[i]==open){
						openArr.push(i)
					}
					if (remain[i]==close){
						closeArr.push(i)
					}
					if (remain[i]==ances){
						ancesArr.push(i)
					}
				}

				remain = replaceAt(remain, openArr[0], "["); 

				levelSearch: for (var i = 1; i<closeArr.length; i++){

					if (openArr[i]>closeArr[i-1]){
						
						remain = replaceAt(remain, closeArr[i-1], "]"); 
						
						for (var j = 0; j<ancesArr.length; j++){
							if ((closeArr[i-1]<ancesArr[j])&&(ancesArr[j]<openArr[i])){
								break levelSearch;
							}
						}

						remain = replaceAt(remain, openArr[i], "["); 
					}

					if (i==closeArr.length-1){
						remain = replaceAt(remain, closeArr[i], "]"); 
					}
				}

				var c = 0;

				var regex = /[\]\+]*[\+][\[]|[\]][\+]|[\]]|[\[]/ig;
				// var regex = /[\[]|[\]]/ig;
				if (regex!=null){
					bro.splice(1,1);
					var newBro = remain.split(regex);

					newBro.forEach(element => {
						bro.push(element);
					});
				}




				bro.forEach(element => {
					recurse(element,url,hyphen);
				});
			}
		}
	}
}

// recurse('b>b1+b2>b21>b211>b2222>b33>b85+b213+b787');
// recurse('b1>b3+b4+b5>b6+b21+b22+b23>b33');
// recurse('b1+b2+b3+b4')
// recurse('b1>b2>b3>b4+b5+b6')
// recurse('b1>b2+b3>b4+b5>b6+b7>b8+b9')
// recurse('b1+b2+(b3>b31+b32>b321+b322)+b4');
// recurse('b1+b2+(b3>b31+(b32>b321+b322)+b33)+b4');

// recurse('b2>b21+(b22>b211+(b212>b2121+b2122)+b23)+b5+(b3>b31+b32)+b4+(b6>b61+(b63>b631+b632)+b62)');

//РАССМОТРЕТЬ
recurse('b1+(b2>b21+b22+b23)+b8+b10+(b3>b31+b32)+(b4>b41+b42)')
// recurse('b1+(b2>b21+b22+b23)+b8>b10+(b3>b31+b32)+(b4>b41+b42)')


console.log(urls);

// If the user pass the name of the block in the command-line options
// that create a block. Otherwise - activates interactive mode
if (blockNameFromCli !== '') {
	//createAnotherFiles()
	// initMakeBlock(blockNameFromCli).catch(printErrorMessage);
} 
else {
	rl.setPrompt('Block name: '.magenta);
	rl.prompt();
	rl.on('line', (line) => {
		const blockName = line.trim();
		initMakeBlock(blockName).catch(printErrorMessage);
	});
}

function createAnotherFiles(){
	urls.forEach(function(item, i, arr) {
		dir = BLOCKS_DIR + item;

		var nam = item.split('/');
		initMakeBlock(nam[nam.length-1]).catch(printErrorMessage);
	});
}

