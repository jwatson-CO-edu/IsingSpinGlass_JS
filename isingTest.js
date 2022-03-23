/*
isingTest.js
James Watson, March 2011
To test the apparently non-functional ising simulation

2011-03-10: Solved, see 'for' loop implementation details in forTest.js
*/

// == Grid Definition ==

function Grid(rows,cols){
	// A two-dimensional array for simulations
	this.myRows = rows;
	this.myCols = cols;
	this.board = [];

	for(var i = 0; i < rows; i++){
		this.board[i] = new Array(cols);
	}
}

Grid.prototype.chk_addr = function(row,col){
	var isValid = false;
	if(row > -1 && row < this.myRows && col > -1 && col < this.myCols){
		isValid = true;
	}
	return isValid;
}

Grid.prototype.print_string = function(){
	var rtnStr = "";
	for(var j = 0; j < this.myRows; j++){
		for(var i = 0; i < this.myCols; i++){
			rtnStr = rtnStr + this.board[j][i].print();
		}
	rtnStr = rtnStr + "\r\n";
	}
	return rtnStr;
}

// == End Grid ==

// == IsingCell Definition ==

function IsingCell(spin, spnChr){
	// An object that can have one of two spins
	this.spin = spin;
	this.spnChr = spnChr;
}

IsingCell.prototype.print = function(){
	return this.spnChr;
}

IsingCell.prototype.set_spin = function(spin){
	if(spin == -1){
		this.spin = spin;
		this.spnChr = "v";
		//this.spnChr = String.fromCharCode(8659);
	}else if(spin == 1){
		this.spin = spin;
		this.spnChr = "^";
		//this.spnChr = String.fromCharCode(8657));
	}else{
		alert("IsingCell.set_spin: An incorrect spin was passed")
	}
}

// == End IsingCell ==

// == StatusCell Definition ==

function StatusCell(letterStatus){
	// An object that can have one of two spins
	this.status = letterStatus;
}

StatusCell.prototype.set_status = function(letterStatus){
	this.status = letterStatus;
}

StatusCell.prototype.print = function(){
	return this.status;
}

// == End StatusCell ==

var ROWS = 3; var COLS = 3;
var block = new Grid(ROWS,COLS);
var coinToss;
var neighbors = [[-1,0], [1,0], [0,-1], [0,1]];
//  neighbors:  [ up   , down , left  , right]

var TKELVIN = 296; //K for 73degF
var k = 1.3806503 * Math.pow(10,-23); // Boltzmann constant in Joules per Kelvin

// Compute the inverse temperature in units of Boltzmann constants
//var beta = 1 / (TKELVIN * k);
var beta = 1;

function random_board(){
	for(var j = 0; j < ROWS; j++){
		for(var i = 0; i < COLS; i++){
			coinToss = Math.random();
			if(coinToss < 0.5){
				block.board[j][i] = new IsingCell(-1,"v");
				//block.board[j][i] = new IsingCell(-1,String.fromCharCode(8659));
			} 
			else {
				block.board[j][i] = new IsingCell(1,"^");
				//block.board[j][i] = new IsingCell(1,String.fromCharCode(8657));
			} 
		}
	}
}

function update(){
	var spinSum = 0;
	var dEnergy = 0;
	for(var j = 0; j < ROWS; j++){
		for(var i = 0; i < COLS; i++){ // for each cell
			spinSum = 0;
			dEnergy = 0;
			WScript.StdOut.WriteLine("At address: " + j + "," + i);
			WScript.StdOut.WriteLine(block.print_string());
			// compute the energy change resulting from flipping the spin of this cell
			for(n in neighbors){
				WScript.StdOut.WriteLine("\t\tOffset address: " + neighbors[n][0] + "," + neighbors[n][1]);
				// For each closest neighbor in the cardinal directions, check if valid address
				if(block.chk_addr(j + neighbors[n][0], i + neighbors[n][1])){
					// If address is valid, add it to the sum
					WScript.StdOut.WriteLine("\t\tNeigbor at " + (j + neighbors[n][0]) + "," +  (i + neighbors[n][1]));
					WScript.StdOut.WriteLine("\t\t" + block.board[j + neighbors[n][0]][i + neighbors[n][1]].spin);
					spinSum = spinSum + block.board[j + neighbors[n][0]][i + neighbors[n][1]].spin
				}
			}
			WScript.StdOut.WriteLine("\tSum of the neighbor spins: " + spinSum);
			dEnergy = 2 * block.board[j][i].spin * spinSum;
			WScript.StdOut.WriteLine("\tEnergy of a flip: " + dEnergy);
			// If there is a net zero or less energy change, flip the spin
			if(dEnergy <= 0){
				block.board[j][i].set_spin(-1 * block.board[j][i].spin);
				WScript.StdOut.WriteLine("\tNegative dE, flipped");
			}else{
				var gen = Math.random();
				var P_flip = Math.exp(-1 * beta * dEnergy);
				WScript.StdOut.WriteLine("\tGenerated: " + gen);
				WScript.StdOut.WriteLine("\tProbability: " + P_flip);
				if(gen < P_flip){
					block.board[j][i].set_spin(-1 * block.board[j][i].spin);
					WScript.StdOut.WriteLine("\tRandomly flipped");
				}
			}
			// Note that the above code automatically utilizes spins as they are changed
		}
	}
}

random_board(); // init the board with a completely random spin configuration
WScript.StdOut.WriteLine("Temperature: " + TKELVIN + "K");
WScript.StdOut.WriteLine("Boltzmann Constant: " + k);
WScript.StdOut.WriteLine("beta: " + beta);
WScript.StdOut.WriteLine("Generated a random board:");
WScript.StdOut.WriteLine(block.print_string());
WScript.StdOut.WriteLine("===");
update();
WScript.StdOut.WriteLine(block.print_string());
