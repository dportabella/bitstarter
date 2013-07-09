#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var loadContentAndCont = function(file, url, contFn) {
  if (file != undefined && url != undefined) {
     console.log("specify either file or url, but not both");
     process.exit(1);
  }

  if (file == undefined && url == undefined) {
    file = HTMLFILE_DEFAULT;
  }
    
  if (file != undefined) {
    file = assertFileExists(file);
  }

  if (url != undefined) {
    restler.get(url).on('complete', function(result) {
      if (result instanceof Error) {
        console.log("error downloading %s. Exiting. error:", url, result.message);
        process.exit(1);
      } else {
        contFn(result);
      }
    });
  } else {
    contFn(fs.readFileSync(file));
  }
}
    
var cheerioHtmlFile = function(htmlContent) {
    return cheerio.load(htmlContent);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};


var checkHtmlFile = function(htmlContent, checksfile) {
    $ = cheerioHtmlFile(htmlContent);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

if(require.main == module) {
    program
        .option('-c, --checks <checks>', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
        .option('-f, --file <file>', 'Path to index.html')
        .option('-u, --url <url>', 'url instead of file')
        .parse(process.argv);

    var contFn = function(htmlContent) {
      var checkJson = checkHtmlFile(htmlContent, program.checks);
      var outJson = JSON.stringify(checkJson, null, 4);
      console.log(outJson);
    } 
    
    loadContentAndCont(program.file, program.url, contFn);

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
