module.exports = (function(){
	var slice = [].slice;
	return function to_array(arr){
		return slice.call(arr)
	};
}());
