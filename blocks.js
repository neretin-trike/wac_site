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

console.log('-------------');

var urls = [];
// var hyphen = '';
		
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
			console.log('============');
			recurse(remain,url,hyphen);
		}
		else{
			hyphen += '— ';
			
			console.log(hyphen+remain);
			
			url = url + '/' + remain;
			urls.push(url);
			console.log('============');
		}
	}
	else{
		if (name.indexOf('+') != -1){
			bro = name.split('+');

			bro.forEach(element => {
				// hyphen += '-';
				// console.log(hyphen+element);
				// urls.push(url+'/'+element);
				// console.log('============');
				recurse(element,url,hyphen);
			});
		}

	}

}

function recurse2(name, url = ''){

	var bro = [];
	var pos = name.indexOf('>');
	
	var roots = name.slice(0,pos);
	var remain = name.slice(pos+1, name.length);

	if (pos != -1){
		console.log('root:'+roots);
		console.log('remain:'+remain);

		url = url + '/' + roots;
		urls.push(url);
		
		console.log('============');

		recurse(remain,url);
	}
	else{
		if (remain.indexOf('+') != -1){
			bro = remain.split('+');

			bro.forEach(element => {
				console.log('bro:'+element);
				urls.push(url+'/'+element);
			});
		}
	}
}


recurse(blockNameFromCli);
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

