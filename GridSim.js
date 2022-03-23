/*
GridSim.js
James Watson, 2014 March
A library of Grid and Cell classes in order to standardize rectangular grid simulations in JS. 
Does not include simulation-specific implementations. This library is designed to be extended by the specific simulations that utilize it
*/

/*
   == LOG ==
2014-05-31: * Imported 'Grid.get_first', 'Grid.set_first' from "IsingMagSim.htm"
            * Imported 'Grid.rand_addr' from "IsingMagSim.htm"
2014-05-16: 'Grid.chk_addr' now checks that the argument is in fact an 'Array' of length 2, but still does not check that the Array is a tuple. If it is
            passed something other than an Array, such as when the result of 'Grid.nhbr_addr' passes 'undefined' instead of an invalid address, it will
            now return false instead of trying to address a non-addressable object and throwing an error.
2014-05-12: Added vars 'MOOREN', 'VONNEUMANNN' to represent the Moore and Von Neumann Neighborhoods, respectively
2014-04-30: Base 'Grid.nhbr_addr' as written, could have returned bad addresses because it did not check the result after computing the closest neighbor
            according to the argument. Function rewritten so that this check is performed. If the check fails, then 'undefined' is returned.
            Test passed (base + TORUS).
2014-04-29: There was a nomenclature disconnect between the definition of 'Grid' and the relative addressing of 'DIRS'.  Despite the natural [ROW,COL]
            implementation of a matrix composed of nested lists, the resulting "toy universe" represented by each 'Grid' is itself more naturally
            represented as a map of [X,Y] coordinates.  In fact, moving from a [ROW,COL] to [COL,ROW] to [XADR,YADR] has been an almost trivial process
            - The 0 index of all address tuples is known as the XADR, the x address
            - The 1 index of all address tuples is known as the YADR, the y address
            - The structure of the 'Grid' can be considered to be collection of columns, one for each XADR. Each column has indices/rows, one for each
              YADR.
            - All tests passed
2014-04-26: * Changed constructors for 'Grid' and 'Cell' to utilize the 'Tagged_init' function to fetch a new 'ID' and create '[obj].meta'.
              All tests passed (base + TORUS). See Learning/"inheritance_test.js" for a simple demonstration.
            * Switched positions of ROW and COL terms in 'Grid.normalize_addr'.  Realized that 'DIRS' had already been set up in an [X,Y] 
              fashion. To save confusion, keeping with the traditional meaning of row and column, with rows horizontal and columns vertical.
              Thus, the correspondence for an [X,Y] tuple would be [COL,ROW] to display it in the tradional way.
2014-04-20: * Wrote 'resetID(arg)', which which will set ID[arg] to zero. 
            * Attempted to write a 'TaggedObject' prototype from which objects that require bookkeeping could inherit. However, a
              superclass prototype cannot be relied upon to help instantiate a new object. When a superprototype is used to create
              an object that will be assigned to a subprototype, 'this' refers to that "superobject". Therefore, the "superobject" has
              not done any work for any "subobjects" created with a "subprototype". The superobject init work is only done once, and
              provides no benefit to the initiation work done in creating the subobject. Not creating a new inheritance system now.
2014-04-19: 'Grid.nhbr_addr' did not have a 'return' statement, added, all tests passed
2014-04-14: Added a version of 'nhbr_addr' to the base 'Grid' class that does not perform normalization/wraparound. Computation of closest neighbors is
            is universal to rectangular grid simulations
2014-04-09: Wrote 'taxi_x_diff', 'taxi_y_diff', 'taxi_diff', 'taxi_x_dist', 'taxi_y_dist', 'taxi_dist'
2014-04-08: * TORUS/'Grid.normalize_addr' now correclty handles negative numbers and multiple wraparounds in the negative direction
            * Copied relavant 2D vector operations from "HTA/geo2D.js"
2014-04-07: * Wrote 'extend_Grid'
            * Wrote TORUS/'Grid.normalize_addr'
2014-04-01: Wrote 'Grid.ID_at_loc'
2014-03-31: To 'Grid.move_fullID' and 'Grid.move_index', added checks to ensure that the desired item was actually popped from the origin cell. The
            'success' flag will only return true if both the origin and destination addresses are valid and the result of the pop operation is a value
            other than 'undefined'
2014-03-28: * 'Grid.move_fullID' now sets the success flag to true after both address checks pass
            * 'Grid.move_index' now sets the success flag to true after both address checks pass
2014-03-26: Restored address validity check to 'Grid.cell_at' in order correct a "no such object" error when attempting to access an out of bounds addr
2014-03-25: 'Grid.cell_at' simply returns a  reference to the array index, if that index does not exist, 'undefined' is returned by the attempted
            attempted access. This is the intended effect
2014-03-20: * 'Grid.move' will be replaced by 'Grid.move_fullID' and 'Grid.move_index' to correspond with the pop methods of 'Cell'
            * Wrote 'Grid.cell_at'
2014-03-17: Added the 'var' keyword to declaration of the 'ID' bookkeeping object
2014-03-13: Wrote 'Grid.fetch', which assumes there is a 'Cell.contents' at the 'Grid.board[<row>][<col>]' location
2014-03-11: Removed 'Cell.blocked' and 'Grid.calc_blocked'. Decisions based on blocked cells are simulation-dependent, not general enough to develop now
2014-03-NN: Fixed the 'Grid' constructor to correctly instantiate 'Cell's
2014-02-28: Wrote 'Cell.pop_by_fullID'

   == TODO ==
* Consider making directions class members of 'Grid', so that they can be conveniently overridden when extensions are loaded
* Re-write 'Cell.add' to flexibly handle multiple object args per call, or just one: "obj", "[obj1, obj2, ...]", or "obj1, obj2, ..."
*/

// == Grid Definition ==

/* -- Implementation Guide -- 
A Grid should look after its own bookkeeping with regards to the contents of cells, but base class does not determine collisions.
Addresses are in format: [row,col]
*/

// = Helper Functions =

function pop_index(arr, index){ // remove item at 'index' from 'arr' and return item. 'arr' is shortened in place
	temp = arr[index]; // assumes was passed a valid index
	arr.splice(index, 1);
	return temp;
}

// - ID Tagging -

/* ~ Implementation Guide ~
Simulation objects can be identified as a standard, combined 'typeName'+'ID' string, known as the "fullID".  Each class should know its own 'typeName',
which is not necessariliy the same as the name of its constructor. Note that this tagging system has no tracking mechanism beyond the number of calls to
'genID'. Therefore, the 'ID' object cannot know whether any particular object with a fullID still exist in memory and does not check to see if previous
names have been "freed".
*/

var ID = {  // ID bookkeeping // note: labels will change between applications, for example...
	    //engram: 4,
	    //agent: 1
};

function genID(typeName){ // Generate a new ID unique to the 'typeName' and return the number
	if( !(ID.hasOwnProperty(typeName)) ){ ID[typeName] = 0; } // if no ID exists for this 'typeName', create key and assign value 0
	ID[typeName]++; // increment for a unique ID per 'typeName', therefore first ID per 'typeName' is always 1 given init 0
	return ID[typeName]; // return the ID number
}

function getID(obj){ // Return a standard, combined 'typeName'+'ID' string if 'obj' has those members, otherwise return null
	var rtnID = null;
	if( obj.typeName && obj.ID ){ rtnID = obj.typeName + String(obj.ID); }
	return rtnID;
}

// if 'typeName' exists within 'ID', set to zero. Otherwise take no action: Do not create name
function resetID(typeName){ if( ID.hasOwnProperty(typeName) ){ ID[typeName] = 0; } }

function Tagged_init(){ // init func to be used by prototypes of objects that will be tagged. assumes 'this.typeName' exists
	this.ID = genID(this.typeName); // Unique int ID for this instance
	this.meta = null; // ------------- Placeholder for unspecified data used in simulation
}

// - End ID -

// - Vector Operations -
// Vectors are represented as lists: [x, y]
// Note: there are separate functions for 2D and 3D so that a looping structure isn't set up for every operation

function vec2D_add(op1, op2){
	// Add op1 and op2 and return a new resultant coordinate set
	return [op1[0] + op2[0], op1[1] + op2[1]];
}

function vec2D_sub(op1, op2){
	// Subtract op2 from op1 and return a new resultant coordinate set
	return [op1[0] - op2[0], op1[1] - op2[1]];
}

function vec2D_scl(vector, scalar){
	// Scale 'vector' coordinates by 'scalar' and return the result
	return [vector[0] * scalar, vector[1] * scalar];
}

// - End Vector -

// - Manhattan (Taxi) Distances -
// URL: http://en.wikipedia.org/wiki/Taxicab_geometry

function taxi_x_diff(op1, op2){ return op2[0] - op1[0]; }
function taxi_y_diff(op1, op2){ return op2[1] - op1[1]; }
function taxi_diff(op1, op2){ return [taxi_x_diff(op1, op2), taxi_y_diff(op1, op2)]; }
// URL: http://www.w3schools.com/jsref/jsref_abs.asp
function taxi_x_dist(op1, op2){ return Math.abs( taxi_x_diff(op1, op2) ); }
function taxi_y_dist(op1, op2){ return Math.abs( taxi_y_diff(op1, op2) ); }
function taxi_dist(op1, op2){ return taxi_x_dist(op1, op2) + taxi_y_dist(op1, op2); }

// - End Manhattan -

// = End Helper =

// = Grid Class =

/* ~ Implementation Guide ~
All addresses are in the format: [X,Y].  Therefore, a 'new Grid([6,6])' will have valid addresses [m,n], 
where {m, n} == any integer 0 through 5.
'Grid' assumes that each address contains a 'Cell', which in turn has 'Cell.contents', an Array of items with valid fullIDs
2014-03-07: At this time trying not to add too many functions that anticipate cases uses that do not yet exist.
2014-03-14: At this time no "stepper" or time-step advancer is included. This is assumed to be handled by the specifc simulation

// cell-by-cell template
for(var i = 0; i < this.dims[0]; i++){ // for every XADR
	for(var j = 0; j < this.dims[1]; j++){ // for every YADR per XADR
		// this.board[i][j] // action for this address
	} 
}

*/

// - Grid Constants -
// Ordering of an address tuple is [X,Y]
var XADR = 0;
var YADR = 1;

/* ~ Direction Constants ~
For a 'Grid' with the layout
    N           
  0 ^ 4 XADR
 0#####      For ease of memory/printing/visualization, the [0,0] address is at the upper left. Of course, the computer doesn't really care, 
  #####      but the arrangement becomes important when orientation is a consideration. Negative relative Y is North. Positive relative
W<#####>E    Y is South. Negative relative X is West. Positive relative X is East.
  #####
 4#####
    v
    S
Y
A
D
R */

// enumerate the directions of 8 closest neighbors (Moore Neighborhood) and associate them with relative addresses
var           NT=0,    NE=1,    ES=2,    SE=3,    SO=4,    SW=5,    WE=6,    NW=7;
var DIRS = [ [ 0,-1], [ 1,-1], [ 1, 0], [ 1, 1], [ 0, 1], [-1, 1], [-1, 0], [-1,-1] ];
var MOOREN = [NT, NE, ES, SE, SO, SW, WE, NW]; // Moore Neighborhood, note it would have been just as well to iterate through 'DIRS'
var VONNEUMANNN = [NT, ES, SO, WE]; // Von Neumann Neighborhood
// ~ End Directions ~

// - End Constants -

function Grid(nuDims){ // A two-dimensional array for simulations
	this.typeName = "Grid"; // ------- String class label used to generate IDs
	this.init(); // ------------------ Do init work for a tagged object
	this.dims = nuDims; // ----------- grid size [rows, cols]
	this.board = []; // -------------- Two-dimensional array to hold cells of various types
	// Init board
	for(var i = 0; i < this.dims[0]; i++){ // for every XADR (column)
		this.board[i] = new Array(this.dims[1]); // create YADRs (rows) for this XADR (column)
		// for every column in the row, create a new, empty 'Cell' stored in each address.  No default contents are supplied
		for(var j = 0; j < this.dims[1]; j++){ this.board[i][j] = new Cell(this, [i,j]); } 
	}
}
Grid.prototype.init = Tagged_init;

// - Address Computation -

Grid.prototype.chk_addr = function(addr){  // Check if the address passed is valid in this instance of Grid 
	var isValid = false;
	if(addr instanceof Array && addr.length === 2 && 
		addr[XADR] > -1 && addr[XADR] < this.dims[XADR] && addr[YADR] > -1 && addr[YADR] < this.dims[YADR]){ isValid = true; } // tests pass, true
	return isValid;
};

Grid.prototype.nhbr_addr = function(nAddr, nDir){ // compute the neighbor of 'nAddr' specified by the 'nDir' code, if result invalid then rtn undefined
	var rtnAddr = undefined, temp = vec2D_add(nAddr, DIRS[nDir]);
	if( this.chk_addr(temp) ){ rtnAddr = temp; }
	return rtnAddr;
};

Grid.prototype.rand_addr = function(){ // Return a random valid address for this 'Grid'
	/* URL: http://www.w3schools.com/jsref/jsref_random.asp, Return a random number between 0 (inclusive) and 1 (exclusive)
	   URL: http://www.w3schools.com/jsref/jsref_floor.asp, Round a number downward to its nearest integer */

	var rtnAddr = [ Math.floor( Math.random() * this.dims[0] ) , Math.floor( Math.random() * this.dims[1] ) ]; // attempt to gen rand addr
	
	return this.chk_addr(rtnAddr) ? rtnAddr : this.rand_addr(); // if valid, then return, else try again!

}

// - End Address -

// - Get Functions -

// Return a reference to a 'Cell' at the given 'addr' if valid, otherwise return 'undefined'
Grid.prototype.cell_at = function(addr){ 
	var rtnPlace = undefined;
	if( this.chk_addr(addr) ){ rtnPlace = this.board[ addr[XADR] ][ addr[YADR] ]; }
	return rtnPlace;
};

Grid.prototype.fetch = function(addr){ // Return a reference to a 'Cell.contents' at the given 'addr' if valid, otherwise return 'undefined'
	var rtnPlace = undefined; // this function assumes a properly fomatted address has been passed
	if( this.chk_addr(addr) ){ rtnPlace = this.board[ addr[XADR] ][ addr[YADR] ].contents; } // assumes there is a 'Cell.contents' at 'addr'
	return rtnPlace;
};

Grid.prototype.ID_at_loc = function(addr, index){ // return the fullID of the object at 'addr' and 'index'
	var rtnID = undefined;
	if( this.chk_addr(addr) && this.fetch(addr)[index] ){ rtnID = getID( this.fetch(addr)[index] ); }
	return rtnID;
} 

// - End Get -

// - Move Functions -

Grid.prototype.move_fullID = function(popID, ognAddr, endAddr){
	// Attempt to move object with 'popID' from the origin cell 'ognAddr' to the destination cell 'endAddr', return Boolean success
	var success = false;
	if( this.chk_addr(ognAddr) && this.chk_addr(endAddr) ){  // if both the origin and target are valid addresses
		var temp = this.cell_at(ognAddr).pop_by_fullID(popID); // attempt to pop the desired item at origin cell, store in 'temp'
		if( temp !== undefined ){ 
			this.cell_at(endAddr).add( temp ); // if popped, 'add' item 'temp' to the destination
			success = true; // both addresses valid and popped desired item, declare victory
		} 
	} 
	return success;
};

Grid.prototype.move_index = function(popIndex, ognAddr, endAddr){
	/* Attempt to move object at 'popIndex' from the origin cell 'ognAddr' to the destination cell 'endAddr', return Boolean success
	Implementation Notes: This function assumes there is a valid simulation object. The object at the index will be moved without identifying it*/
	var success = false;
	if( this.chk_addr(ognAddr) && this.chk_addr(endAddr) ){  // if both the origin and target are valid addresses
		var temp = this.cell_at(ognAddr).pop_by_index(popIndex);  // attempt to pop the desired item at origin cell, store in 'temp'
		if( temp !== undefined ){ 
			this.cell_at(endAddr).add( temp ); // if popped, 'add' item 'temp' to the destination
			success = true; // both addresses valid and popped desired item, declare victory
		}
	} 
	return success;
};

// - End Move -

// - Shallow Get and Set -

/* Useful for simulations in which each 'Cell' will only ever have one occupant. */

Grid.prototype.get_first = function(addr){ // return the 0 index of the 'Cell.contents' at 'addr' if it exists, otherwise return 'undefined'
	var rtnPlace = this.fetch(addr);
	if( rtnPlace !== undefined ){
		if(rtnPlace.length < 1){ rtnPlace = undefined; }else{ rtnPlace = rtnPlace[0]; }
	}
	return rtnPlace;
}

Grid.prototype.set_first = function(addr, obj){ // assign 'obj' to the 'Cell.contents[0]' at addr if valid, if valid addr and index DNE, then add
	var success = false; // this function assumes 'Cell.contents' exists at a valid addr. No collision check made before overwriting
	var place = this.fetch(addr);
	if( place !== undefined ){
		if(place.length < 1){ place.push(obj); }else{ place[0] = obj; } // place[0] will be overwritten
		success = true;
	}
	return success; // return success if 'addr' was valid. This assumes the assignment operation was a success
}
	
// - End Shallow -

// = End Grid =

// = Cell Class =

/* - Implementation Guide - 
As of 2014-02-20, implementation of 'Cell' is that 'Cell.contents' should be an Array.  This decision is predicated on the assumption that the population
of a cell should never be more than a few items.  Operations on 'Cell' contents depend on '<arrayName>.slice', which can be costly for long Arrays.
Should 'Grid'/'Cell' ever become the basis for a "grid-free" simulation that is nontheless partitioned into a grid of regions to save on collision and
distance calcs, then redefining or extending 'Cell' into an implementation where 'Cell.contents' is based on associative arrays should be considered. 
Have also for the time being abandoned the idea of having a base 'Cell' class have Array-based and Object-based subclasses to fully envelop all those
anticipated use cases. Firstly, these use cases do not exist yet.  Secondly, this adds extra time and complexity where none was demanded. */

function Cell(celCon, celAddr, celPop){ // Cell base class
	this.typeName = "Cell"; // ------------ String class label used to generate IDs
	this.init(); // ----------------------- Do init work for a tagged object
	this.container = celCon; // ----------- Reference to the containing 'Grid'
	this.addr = celAddr || [null, null]; // Tuple, addess of the 'Cell' within the 'Grid'
	this.contents = celPop || []; // ------ Array of 'Cell' contents; agents, resources, terrain, etc
}
Cell.prototype.init = Tagged_init;

// URL, call JS function with args in array with 'apply': http://msdn.microsoft.com/en-us/library/ie/4zc42wh1(v=vs.94).aspx
Cell.prototype.add = function(obj){ // Push 'obj' onto 'Cell.contents'
	this.contents.push(obj); // 2014-02-25: At this time, 'Cell.add' does not handle multiple objects per call
};

Cell.prototype.pop_by_index = function(index){ // pop object at 'Cell.contents' index if index valid, otherwise return 'undefined'
	var temp = undefined;
	if(this.contents[index] !== undefined){ temp = pop_index(this.contents, index); } // If content index valid, pop, assign to 'temp'
	return temp; // if a valid index was not passed, function returns 'undefined'
};

Cell.prototype.pop_by_fullID = function(nFullID){ // linear search of 'Cell.contents' for object with fullID, pop if found, otherwise return 'undefined'
	var temp = undefined; 
	//var found = false;
	for(var i = 0; i < this.contents.length; i++){
		if( getID(this.contents[i]) === nFullID ){ temp = this.pop_by_index(i); break; } // match found, pop, exit loop
	}
	return temp;
};

Cell.prototype.print = function(){ return "!"; } // Placeholder, 'print' will be simulation-specific.  To be overridden

// = End Cell =

// == End Grid ==


// == Grid Extensions ==

/* -- Implementation -- 
Modules are included to extend or further define the behavior of 'Grid' and supporting classes and functions.  These modules, while less general than
the original 'Grid', are general enough to possibly be applicable to multiple simulations. 
2014-04-04: Currently, additions and modifications to the base classes are grouped by "flavor", with each flavor having an associated load function. */

// - Module Code Constants -
var TORUS = 2;
// - End Codes -

// URL: http://www.w3schools.com/js/js_switch.asp
function extend_Grid(module){ // FIXME: loader function is unfinished!
	switch(module){
		case TORUS: 
			Grid_load_torus();
			break;
		default:
	}
}

/* = Toroidal =
A TORUS type world wraps around to the opposite edge for address indices beyond the normal bounds recognized by 'Grid.chk_addr'.  Naturally, attempting
to call move operations on these out-of-bounds addresses will result in a false success flag returned from these functions. Instead, client code 
handling a toroidal world should use 'Grid.normalize_addr' to obtain a valid address before using any of 'Grid's standard move functions. No facility
is provided to keep track of how many times the index wraps around the 'Grid' limits.  Such should be handled by the specific simulation when path-
dependent information is needed. (Functions in the above 'Manhattan (Taxi) Distances' might be useful in such cases.) */

function Grid_load_torus(){ // loads extensions to 'Grid' and support classes to support a toroidal grid

	


	Grid.prototype.normalize_addr = function(nAddr){ // compute wraparpund for an improper address in this 'Grid', using modulo, and return
		if(nAddr[XADR] < 0){ nAddr[XADR] = this.dims[XADR] + (nAddr[XADR] % this.dims[XADR]); }
		if(nAddr[YADR] < 0){ nAddr[YADR] = this.dims[YADR] + (nAddr[YADR] % this.dims[YADR]); }
		return [ nAddr[XADR] % this.dims[XADR] , nAddr[YADR] % this.dims[YADR]  ];
	};

	// Compute the normalized address that is 'nAddr' plus the relative offset to a closest neighbor defined by 'DIRS'
	Grid.prototype.nhbr_addr = function(nAddr, nDir){ return this.normalize_addr( vec2D_add(nAddr, DIRS[nDir]) ); };
}

// = End Torus =

// == End Extensions ==