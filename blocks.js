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

console.log('-------------');

var paths = [];

function replaceAt(string, index, replace) {
	return string.substring(0, index) + replace + string.substring(index + 1);
}

function replaceBrackets(remain){

	var openArr = [],
		closeArr = [],
		ancesArr = [];

	for (var i = 0; i<remain.length; i++){
		if (remain[i]=="("){
			openArr.push(i)
		}
		if (remain[i]==")"){
			closeArr.push(i)
		}
		if (remain[i]==">"){
			ancesArr.push(i)
		}
	}

	remain = replaceAt(remain, openArr[0], "["); 
	levelSearch: for (var i = 1; i<=closeArr.length; i++){
		if (openArr[i]>closeArr[i-1]){
			remain = replaceAt(remain, closeArr[i-1], "]"); 
			for (var j = 0; j<ancesArr.length; j++){
				if ((closeArr[i-1]<ancesArr[j])&&(ancesArr[j]<openArr[i])){
					break levelSearch;
				}
			}
			remain = replaceAt(remain, openArr[i], "["); 
		}
	}
	remain = replaceAt(remain, closeArr[closeArr.length-1], "]"); 

	return remain;
}

function splitForDescendants(remain,bro){
	var regex = /[\]][\+]|[\[]|[\]]/ig;
	var newBro = remain.split(regex);

	if (regex!=null){

		newBro.forEach(function(item, i) {
			if (item.indexOf('>') == -1){
	
				var temp = item.split('+');
	
				newBro.splice(i,1);
	
				temp.forEach(el => {
					newBro.push(el);
				});
			}
		});

		bro.splice(1,1);

		var positiveArr = newBro.filter(function(arg) {
			return arg != "";
		});

		positiveArr.forEach(element => {
			bro.push(element);
		});
	}

	return bro;
}

function parseForTree(name, path = '',hyphen = ''){
	var bro = [];

	var posAncestor = name.indexOf('>');
	var posDescendant = name.indexOf('+');

	if ( ((posAncestor!= -1) && (posAncestor < posDescendant))  || (posDescendant ==-1)){

		var roots = name.slice(0,posAncestor);
		var remain = name.slice(posAncestor+1, name.length);

		hyphen += '— ';
		
		if (posAncestor != -1){
			
			console.log(hyphen+roots);

			path += '/' + roots;
			paths.push(path);
			console.log('··············');
			parseForTree(remain,path,hyphen);
		}
		if (posAncestor == -1){
			
			console.log(hyphen +remain);
			
			path += '/' + remain;
			paths.push(path);
			console.log('··············');
		}
	}
	else{
		if (posDescendant != -1){

			if (posAncestor == -1){
				bro = name.split('+');
			}
			else{
				var roots = name.slice(0,posDescendant);
				var remain = name.slice(posDescendant+1, name.length);

				bro[0] = roots;
				bro[1] = remain;

				if( remain.search('[\(]|[\)]') != -1 ){
					remain = replaceBrackets(remain);	
					bro = splitForDescendants(remain,bro);				
				}
			}

			bro.forEach(element => {
				parseForTree(element,path,hyphen);
			});
		}
	}
}

// var regex = /[\]\+]*[\+][\[]|[\]][\+]|[\]]|[\[]/ig;

// parseForTree('b>b1+b2>b21>b211>b2222>b33>b85+b213+b787');
// parseForTree('b1>b3+b4+b5>b6+b21+b22+b23>b33');
// parseForTree('b1+b2+b3+b4')
// parseForTree('b1>b2>b3>b4+b5+b6')
// parseForTree('b1>b2+b3>b4+b5>b6+b7>b8+b9')
// parseForTree('b1+b2+(b3>b31+b32>b321+b322)+b4');
// parseForTree('b1+b2+(b3>b31+(b32>b321+b322)+b33)+b4');
// parseForTree('b1+(b2>b21+b22+b23)+b8+b10+(b3>b31+b32)+(b4>b41+b42)')
// parseForTree('b1+(b2>b21+b22+b23)+b8>b10+(b3>b31+b32)+(b4>b41+b42)')
// parseForTree('b2>b21+(b22>b211+(b212>b2121+b2122)+b23)+b5');
// parseForTree('b2>b21+(b22>b211+(b212>b2121+b2122)+b23)+b5+(b3>b31+b32)+b4+(b6>b61+(b63>b631+b632)+b62)');

parseForTree(blockNameFromCli);
console.log(paths);

// If the user pass the name of the block in the command-line options
// that create a block. Otherwise - activates interactive mode
if (blockNameFromCli !== '') {
	// createAnotherFiles()
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
	paths.forEach(function(item, i, arr) {
		dir = BLOCKS_DIR + item;

		var name = item.split('/');
		initMakeBlock(name[name.length-1]).catch(printErrorMessage);
	});
}

