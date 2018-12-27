/**
 * @author : Ferhat Kortak <2015510099>
 * @author : Gözde Işıldak <2015510034>
 * Dokuz Eylul University - November/2018
 * 
 * Regular Expression to Nfa Converter
 * Theory of Computation Homework
 * 2018 Fall Term
 *
 * The program converts Regular Expression string
 * to postfix notation, then it constructs a 
 * Non-Deterministic Finite Automata. Thanks to
 * it, the program can check a given input is 
 * valid or not with regex via NFA.
 * 
 * -REFERENCES-
 * 
 * The Shunting Yard Algorithm
 * http://www.oxfordmathcenter.com/drupal7/node/628
 * https://gist.github.com/DmitrySoshnikov/1239804/ba3f22f72d7ea00c3a662b900ded98d344d46752
 * 
 * Non-Deterministic Finite Automata Construction
 * https://tajseer.files.wordpress.com/2014/06/re-nfa-dfa.pdf
 * https://www.cs.york.ac.uk/fp/lsa/lectures/REToC.pdf
 * 
 * Textbook : Introduction to Computation Theory : Michael Sipser(2nd Edition)
 * 
 */

// Rows: States | Columns: Inputs
var automaton = [];
var nfa_stack = [];
var inputs = [];

function GenerateNfa(inp) {

    var input = regextopostfix(fixRegEx(inp));
    
    // Add an empty state as first state for avoid error handling -> (NullPointer)
    automaton.push([]);

    
    inputs[0] = "E";
    addInput(automaton);

    for (let i = 0; i < input.length; i++) {
        var current_input = input[i];
        if (isLetter(input[i])) {

            if (inputs.includes(current_input) == false) {
                addInput(automaton);
                inputs[inputs.length] = current_input;
            }

            nfa_stack[nfa_stack.length] = addStates(current_input);

        } else if (input[i] == "*") {
            nfa_stack[nfa_stack.length - 1] = star(nfa_stack[nfa_stack.length - 1]);
        } else if (input[i] == ".") {
            nfa_stack[nfa_stack.length - 2] = concatenation(nfa_stack[nfa_stack.length - 2], nfa_stack[nfa_stack.length - 1]);
            nfa_stack.pop();

        } else if (input[i] == "+") {
            nfa_stack[nfa_stack.length - 2] = union(nfa_stack[nfa_stack.length - 1], nfa_stack[nfa_stack.length - 2]);
            nfa_stack.pop();
        }
    }

    return automaton;
}

function union(one, two) {
    var _accept = [];

    // (i) Add a new state, 
    var newState_number = addState().length-1;

    // (ii) Add two new transitions which connects finish1 and start2 using epsilon
    automaton[newState_number][0] = [one[0], two[0]];

    // Return index of new submachine's start and accept states
    _accept = [];
    // _accept.push(one[1]);
    for (let u = 0; u < one[1].length; u++) {
        _accept.push(one[1][u]);
    }
    for (let o = 0; o < two[1].length; o++) {
        _accept.push(two[1][o]);
    }
    return [newState_number, _accept];
}

// Add a new state(Row)
function addStates(current_input) {
    var column_count = automaton[0].length;
    var temp_state1 = [];
    var temp_state2 = [];
    var start = [];
    var end = [];

    for (var i = 0; i < column_count; i++) {
        if (i == 0){
            temp_state1[i] = [-1];
            temp_state2[i] = [-1];
        }
        else{
            temp_state1[i] = -1;
            temp_state2[i] = -1;
        } 
    }

    var input_index = findLetter(current_input, inputs);
    temp_state1[input_index] = automaton.length + 1;
    start = automaton.length;
    end = [automaton.length + 1];
    automaton.push(temp_state1);
    automaton.push(temp_state2);
    return [start, end];
}

function addState() {
    var i = 0;
    var column_count = automaton[0].length;
    var temp_state = [];

    for (; i < column_count; i++) {
        if (i == 0) {
            temp_state[i] = [-1];
        } else {
            temp_state[i] = -1;
        }
    }
    automaton.push(temp_state);
    return automaton;
}

// Check given letter is in input list whether or not
function findLetter(letter) { 
    for (let index = 0; index < inputs.length; index++) {
        if (inputs[index] == letter)
            return index;
    }
}

function addInput(nfa_stack) {
    var i = 0;
    var column_count = nfa_stack[0].length;
    for (; i < nfa_stack.length; i++) {
        if (column_count == 0) {
            nfa_stack[i][column_count] = [-1];
        } else {
            nfa_stack[i][column_count] = -1;
        }

    }
    return nfa_stack;
}

function regextopostfix(input) {
    var output = [];
    var stack = [];

    for (var i = 0; i < input.length; i++) {
        if (input[i] == "(") {
            stack.push(input[i]);
        } else if (input[i] == ")") {
            while (stack[stack.length - 1] != "(") {
                output.push(stack.pop());
            }
            stack.pop();

            // Work with stack
        } else {
            while (stack.length) {
                var stackpeek_predecence = predecence(stack[stack.length - 1]);
                var current_predecence = predecence(input[i]);

                if (stackpeek_predecence >= current_predecence) {
                    output.push(stack.pop());
                } else {
                    break;
                }
            }
            stack.push(input[i]);
        }
    } // End for loop
    while (stack.length)
        output.push(stack.pop());

    return output.join("");
}

function predecence(char) {
    return predecences[char] || 4;
}
var predecences = {
    '(': 1,
    '+': 2,
    '.': 3,
    '*': 4
    // else 6
}

function is_operator(inp) {
    if (inp === "*" || inp === "+" || inp === "(" || inp === ")")
        return true;
    else
        return false;
}

function fixRegEx(regEx) {
    var i = 0;
    var fixRegEx = [];
    var j = 0;
    var limit = regEx.length - 1;
    while (i < limit) {
        // Two consecutive inputs
        if (((is_operator(regEx[i]) == false || regEx[i] === ')' || regEx[i] === '*') && is_operator(regEx[i + 1]) == false) 
            || ((is_operator(regEx[i]) == false || regEx[i]==='*') && (regEx[i + 1]) == '(')) {
            fixRegEx[j] = regEx[i];
            fixRegEx[j + 1] = ".";
            fixRegEx[j + 2] = regEx[i + 1];
            j = j + 2;
        }
        else {
            fixRegEx[j] = regEx[i];
            fixRegEx[j + 1] = regEx[i + 1];
            j = j + 1;
        }
        i++;
    }
    console.log("Fixed Regex : ", fixRegEx.join(""));
    return fixRegEx.join("");
}


function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
}

// Binary operation
function concatenation(one, two) { 
    var _start, _accept;
    substart1 = one[0];
    substart2 = two[0];
    subaccepts1 = one[1];
    subaccepts2 = two[1];

    // (i) Add transitions using epsilons from old accept states to start states
    for (var j = 0; j < subaccepts1.length; j++) {
        if (automaton[subaccepts1[j]][0] == -1) {
            automaton[subaccepts1[j]][0] = [substart2];
        } else {
            automaton[subaccepts1[j]][0].push(substart2);
        }
    }

    // (ii) Remove all accept states from {submachine}
    subaccepts1 = [];
    _start = substart1;
    _accept = subaccepts2;

    return [_start, _accept];
}

// Unary operation
function star(one) { 
    var _start, _accept = [];

    substart1 = one[0];
    subaccepts1 = one[1];
    // (i) Add a new state as an accept state(also start state - q3)
    addState(); // (q3)

    // (ii) Add a transition from (q3) to start state(q1) using epsilon -> [i][0] = epsilon
    automaton[automaton.length - 1][0] = [substart1];
    _start = automaton.length - 1;

    // (iii) Add a new transition from -all- accept stateS to start state(q1)
    for (var i = 0; i < subaccepts1.length; i++) {
        if (automaton[subaccepts1[i]][0].length &&
            automaton[subaccepts1[i]][0][0] != [-1]) {
            automaton[subaccepts1[i]][0].push(substart1);
        } else {
            automaton[subaccepts1[i]][0] = [substart1];
        }
    }

    _accept = subaccepts1;
    _accept.push(automaton.length - 1);

    // Return index of new submachine's start and accept states
    return [_start, _accept];
}

function simulate(start, word, automaton, accepts) {

    var paths = [];
    paths[paths.length] = start;
    control(start, paths, automaton);
    var child_paths = [];

    for (let i = 0; i < word.length; i++) {
        // If current word is not in input regex
        if(!inputs.includes(word[i]))
            return false;

        var letter = findLetter(word[i], inputs);
        for (let j = 0; j < paths.length; j++) {
            if (automaton[paths[j]][letter] != -1) {
                if (child_paths.includes(automaton[paths[j]][letter]) == false) {
                    child_paths[child_paths.length] = automaton[paths[j]][letter];
                }
                control(automaton[paths[j]][letter], child_paths, automaton);
            }
        }

        if (child_paths == null)
            return false;

        paths = child_paths;
        child_paths = [];
        //control(start, paths, automaton);
    }
    return comparison(accepts, paths);
}

function comparison(accepts, nfa_stack) {
    for (let i = 0; i < accepts.length; i++) {
        for (let j = 0; j < nfa_stack.length; j++) {
            if (accepts[i] == nfa_stack[j])
                return true;
        }
    }
    return false;
}

function control(state, arr, automaton, prevstate) {
    if (automaton[state][0] != -1) {

        for (let i = 0; i < automaton[state][0].length; i++) {
            if (arr.includes(automaton[state][0][i]) == false) {
                arr[arr.length] = automaton[state][0][i];
            }
        }
    }
}

function TestNfa(regex,input){
    automaton = [];
    nfa_stack = [];
    inputs = [];
    GenerateNfa(regex);
    var result = simulate(nfa_stack[0][0], input, automaton, nfa_stack[0][1]);
    return (result);
}