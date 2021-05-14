// function Type() { };

// var	types = [
// 	new Array,
//     [],
// 	new Boolean,
//     true,        // remains unchanged
// 	new Date,
// 	new Error,
// 	new Function,
// 	function(){},
// 	Math,
// 	new Number,
// 	1,           // remains unchanged
// 	new Object,
// 	{},
// 	new RegExp,
// 	/(?:)/,
// 	new String,
// 	"test"       // remains unchanged
// ];

// for(var i = 0; i < types.length; i++) {
// 	types[i].constructor = Type;
// 	types[i] = [ types[i].constructor, types[i] instanceof Type, types[i].toString() ];
// };

// console.log( types.join("\n") );


var obj = { a: 1 }
var result = Object.getOwnPropertyDescriptor(obj, 'a')
console.log(result)