var fs = require("fs");

var jsdom =require("jsdom");
var libxmljs = require("libxmljs");

// from http://ejohn.org/blog/javascript-benchmark-quality/
function runTest(name, test, next){
  var runs = [], r = 0;

  setTimeout(function(){
    var start = (new Date).getTime(), diff = 0;

    for ( var n = 0; diff < 5000; n++ ) {
      test();
      diff = (new Date).getTime() - start;
    }

    runs.push( n );

    if ( r++ < 4 )
      setTimeout( arguments.callee, 0 );
    else {
      done(name, runs);
      if ( next )
        setTimeout( next, 0 );
    }
  }, 0);
}


var xml =  '<?xml version="1.0" encoding="UTF-8"?>' +
           '<root>' +
               '<child foo="bar">' +
                   '<grandchild baz="fizbuzz">grandchild content</grandchild>' +
               '</child>' +
               '<sibling>with content!</sibling>' +
           '</root>';

var xml = fs.readFileSync('./sample.xml', 'utf-8');

//console.log(xml);

console.time("libxmljs");
var doc1 = libxmljs.parseXml(xml);
console.timeEnd("libxmljs")

//console.log(doc1.toString());

console.time("jsdom");
var doc2 = jsdom.jsdom(xml, jsdom.level(1, "core"));
console.timeEnd("jsdom")

//console.log(doc2);

function test1(){
    var doc1 = libxmljs.parseXml(xml);
}

function test2(){
    var doc2 = jsdom.jsdom(xml, jsdom.level(1, "core"));
}

function done(name, runs){
    console.log("test: "+name+ ", runs: "+runs);
}

runTest("jsdom", test2);
runTest("libxmljs", test1);

/*

Sample output:

libxmljs: 3ms
jsdom: 472ms
test: jsdom, runs: 14,13,14,14,14
test: libxmljs, runs: 710,668,722,633,696

*/
