define(function (require, exports, module) {
	console.log('asdasdasd')
	var LanguageManager = brackets.getModule("language/LanguageManager");
	var CodeMirror = brackets.getModule("thirdparty/CodeMirror/lib/codemirror");
	
	var typesMatch = require("src/codehinting/types").typesMatch;
	
	CodeMirror.defineMode("solidity", function (config, parserConfig) {
		return {
			startState: function () {
				return {
					blockDeclaration: false,
					variableDeclaration: false,
					insideComment: false
				};
			},
			token: function (stream, state) {
				if (stream.match(/\/\*/)) {
					state.insideComment = true;
					return "comment";
				}
				if (state.insideComment) {
					if(stream.match(/.*?\*\//)){
						state.insideComment = false;
					}else{
						stream.next();
					}
					return "comment";
				}
				if (stream.match(/\/\/.*/)) {
					return "comment";
				}

				if (stream.match(/"(?:[^\\]|\\.)*?(?:"|$)/) || stream.match(/'(?:[^\\]|\\.)*?(?:'|$)/)) {
					return "string";
				}

				if (stream.peek() == ".") {
					state.property = true;
					stream.next();
					return null;
				}

				if (state.property) {
					state.property = false;
					if (stream.eatWhile(/[a-zA-Z$_][\w$]*/)) {
						return "property";
					} else {
						stream.next();
					}
				}
				
				if(stream.match(typesMatch)){
					if(!state.mappingDeclaration){
						state.variableDeclaration = true;
					}
					return "keyword";
				}

				if (stream.match(/(memory|storage|pure|view|import|as|from|\*|pragma|return|if|for|while|else|this|returns|external|internal|public|payable|constant|require)\b/)) {
					return "keyword";
				}
				
				if(stream.match(/mapping\b/)){
					state.mappingDeclaration = true;
					return "keyword";
				}

				if (stream.match(/(contract|modifier|function|library|struct)\b/)) {
					state.blockDeclaration = true;
					return "keyword";
				}
				
				if(state.variableDeclaration){
					if(/[^A-Za-z0-9_$ ]/.test(stream.peek())){
						state.variableDeclaration = false;
					}else{
						stream.next();
						return "variable";
					}
				}
				
				if(state.mappingDeclaration && stream.peek() == ")"){
					stream.next();
					state.mappingDeclaration = false;
					state.mappingName = true;
					return null;
				}
				
				if(state.mappingName){
					if(/[^A-Za-z0-9_$ ]/.test(stream.peek())){
						state.mappingName = false;
					}else{
						stream.next();
						return "variable";
					}
				}

				if (stream.match(/true|false/)) {
					return "atom";
				}

				if (state.blockDeclaration) {
					if (stream.match(/.+?(?=({|\())/)) {
						state.blockDeclaration = false;
						return "variable";
					}
				}

				if (stream.match(/0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i)) {
					return "number";
				}

				if (stream.eatWhile(/[a-zA-Z_$][\w$]*/)) {
					return "variable-2";
				} else {
					stream.next();
					return null;
				}
			}
		};

	});

	LanguageManager.defineLanguage("solidity", {
		name: "Solidity",
		mode: "solidity",
		fileExtensions: ["sol"],
		blockComment: ["/*", "*/"],
		lineComment: ["//", "//"]
	});
});
