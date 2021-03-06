var fs = require("fs");

var jsdom = require("jsdom");
var libxmljs = require("libxmljs");

var xmldom = require("xmldom");
var bb = require("blue-button");
var bbxml = require("blue-button-xml");
var bbcms = require("blue-button-cms");
var bbfhir = require("blue-button-fhir");
var bbg = require("blue-button-generate");
var bbu = require("blue-button-util");


// from http://ejohn.org/blog/javascript-benchmark-quality/
function runTest(name, test, next) {
    var runs = [],
        r = 0;

    setTimeout(function() {
        var start = (new Date).getTime(),
            diff = 0;

        for (var n = 0; diff < 5000; n++) {
            test();
            diff = (new Date).getTime() - start;
        }

        runs.push(n);

        if (r++ < 4)
            setTimeout(arguments.callee, 0);
        else {
            done(name, runs);
            if (next)
                setTimeout(next, 0);
        }
    }, 0);
}

// from libxmljs
var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<root>' +
    '<child foo="bar">' +
    '<grandchild baz="fizbuzz">grandchild content</grandchild>' +
    '</child>' +
    '<sibling>with content!</sibling>' +
    '</root>';

var xml = fs.readFileSync('./sample.xml', 'utf-8');

var cms = fs.readFileSync("sample.txt").toString();

var doc = bb.parse(xml);


// compile FHIR bundle
var cases_a = require('./fixtures/unit/allergyIntolerance');
var cases_c = require('./fixtures/unit/condition');
var cases_ma = require('./fixtures/unit/medicationAdministration');
var cases_mp = require('./fixtures/unit/medicationPrescription');
var cases_ors = require('./fixtures/unit/observation-result-single');
var cases_or = require('./fixtures/unit/observation-result');
var cases_ov = require('./fixtures/unit/observation-vital');
var cases_p = require('./fixtures/unit/patient');

var arrayset = bbu.arrayset;

var resources = [];

var sections = [
    'allergies',
    'problems',
    'medications',
    'medications',
    'results',
    'results',
    'vitals'
];

[cases_a, cases_c, cases_ma, cases_mp, cases_ors, cases_or, cases_ov].forEach(function (cmodule, index) {
    var sectionName = sections[index];
    cmodule.forEach(function (c) {
        arrayset.append(resources, c.resources);
    });
});
arrayset.append(resources, cases_p[0].resources);

var bundle = {
    resourceType: 'Bundle',
    entry: resources
};

var actual = bbfhir.toModel(bundle);


console.log('bundle', bundle);

console.log('\n');

console.log('actual FHIR model', actual);

// console.time("libxmljs");
// var doc1 = libxmljs.parseXml(xml);
// console.timeEnd("libxmljs")

// //console.log(doc1.toString());

// console.time("jsdom");
// var doc2 = jsdom.jsdom(xml, jsdom.level(1, "core"));
// console.timeEnd("jsdom")

// //console.log(doc2);


// console.time("xmldom");
// var p = new xmldom.DOMParser()
// var doc3 = p.parseFromString(xml, 'text/xml');
// console.timeEnd("xmldom")

//console.log(doc2);

console.time("blue-button");
var doc4 = bb.parse(xml);
console.timeEnd("blue-button");

console.time("blue-button-xml");
var doc5 = bbxml.xmlUtil.parse(xml);
console.timeEnd("blue-button-xml");

console.time("blue-button-cms");
var doc6 = bbcms.parseText(cms);
console.timeEnd("blue-button-cms");

console.time("blue-button-generate");
var doc7 = bbg.generateCCD(doc);
console.timeEnd("blue-button-generate");

console.time("blue-button-fhir");
var doc8 = bbfhir.toModel(bundle);
console.timeEnd("blue-button-fhir");


// function test1() {
//     var doc1 = libxmljs.parseXml(xml);
// }

// function test2() {
//     var doc2 = jsdom.jsdom(xml, jsdom.level(1, "core"));
// }

// function test3() {
//     var doc3 = new xmldom.DOMParser().parseFromString(xml, 'text/xml');
// }

//
function bbtest() {
    var doc4 = bb.parse(xml);
}

function bbxmltest() {
    var doc5 = bbxml.xmlUtil.parse(xml);
}

function bbcmstest() {
    var doc6 = bbcms.parseText(cms);
}

function bbgtest() {
    var doc7 = bbg.generateCCD(doc);
}

function bbfhirtest() {
    var doc8 = bbfhir.toModel(bundle);
}

function done(name, runs) {
    console.log("test: " + name + ", runs: " + runs);
    var timestamp = new Date();
    var printString = {
        "time": timestamp,
        "test": name,
        "runs": runs
    };
    console.log(printString);
    fs.appendFile('benchmark.json', JSON.stringify(printString)+", ", function(err) {
        if (err) throw err;
    });
}

// runTest("jsdom", test2);
// runTest("libxmljs", test1);
// runTest("xmldom", test3);


// runTest("bb", bbtest);
// runTest("bbxml", bbxmltest);
// runTest("bbcms", bbcmstest);
// runTest("bbg", bbgtest);
runTest("bbfhir", bbfhirtest);


/*

Sample output:

libxmljs: 8ms
jsdom: 664ms
xmldom: 86ms

test: jsdom, runs: 11,12,12,12,12
test: libxmljs, runs: 578,585,603,603,603
test: xmldom, runs: 80,96,109,108,114

*/
