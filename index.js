"use strict";
var jsdom = require("jsdom");
var path = require("path");
var fs = require("fs");
var token = process.argv[3] || process.env.GITHUB_TOKEN;

if (!process.argv[2]) {
    console.log("Must specify which local file to run this on.");
    process.exit(1);
}

if (!token) {
    console.log("Cannot access the API without providing a token as a GITHUB_TOKEN env variable, or as the last arg of the CLI.");
    process.exit(1);
}

var github = require("simple-github")({
    token: token
});

var filename = process.argv[2];
filename = path.join(process.cwd(), filename);
var file = fs.readFileSync(filename, "utf8");

function parseIssueData(html) {
    var chunks = html.split(/([!.?])\s+[A-Z]/);
    var title = chunks[0]
    if (chunks.length > 1) {
        title += chunks[1];
    }
    var body = html.replace(title, "").trim()
    
    return {
        title: title,
        body: body
    };
}

jsdom.env({
    html: file,
    features: {
        QuerySelector : true,
        FetchExternalResources : false
    },
    done: function (err, orgWin) {
        if (err) {
          throw err;
        }
        var issues = orgWin.document.querySelectorAll('.issue');
        
        jsdom.env({
            html: file,
            features: {
                QuerySelector : true,
                FetchExternalResources : ["script", "img", "css", "frame", "iframe", "link"]
            },
            done: function (err, window) {
                if (err) {
                  throw err;
                }

                window.onload = function() {
                    var issueBase = window.respecConfig.issueBase;
                    if (!issueBase) {
                        console.log("Can't process issues without a config.issueBase link to GitHub issue tracker.");
                        process.exit(1);
                    }
                    //console.log()
                    function setDataURL(node, data) {
                        node.setAttribute("data-number", data.number);
                    }
                    
                    function createIssue(issue, callback) {
                        var num = issue.getAttribute("data-number");
                        var url = "/repos" + issueBase.split("github.com")[1].replace(/\/$/, '');
                        var body = parseIssueData(issue.innerHTML);
                        
                        function next() {
                            if (issues.length) {
                                createIssue(Array.prototype.shift.call(issues), callback);
                            } else {
                                callback(null);
                            }
                        }
                        
                        if (num) {
                            url += "/" + num;
                            github.request({
                                url: url,
                                method: "get"
                            }).then(function(prev) {
                                if (prev.title == body.title && prev.body == body.body) {
                                    // There hasn't been any change to the issue. Next!
                                    console.log("skip", prev.number, prev.title)
                                    next();
                                } else {
                                    // There has. Patch it.
                                    github.request({
                                        url: url,
                                        method: "patch",
                                        body: body
                                    }).then(function(data) {
                                        console.log("patch", data.number, data.title)
                                        setDataURL(issue, data);
                                        next();
                                    }).fail(console.log);
                                }
                            }).fail(function() {
                                console.log("Can't connect to GH API or current spec is out of sync with GH issue tracker.")
                                process.exit(1);
                            });
                        } else {
                            github.request({
                                url: url,
                                method: "post",
                                body: body
                            }).then(function(data) {
                                console.log("post", data.number, data.title)
                                setDataURL(issue, data);
                                next();
                            }).fail(console.log);
                        }
                    }
                    
                    createIssue(Array.prototype.shift.call(issues), function() {
                        fs.writeFileSync(filename, orgWin.document.doctype + orgWin.document.innerHTML);
                    });
                }
            }
        });
        
    }
});

