//global handle to board div and controls div
// so we dont have to look it up every time
let boardNode;
let controlsNode;
//if AI goes first, need to know what players mark is
let playerMark = "X"
let aiStart = "O";

//holds the board buttons in nested arrays
//accessed like board[0][0] (top left button)
const board = [];

const freeSpaces = 9


//assoc array of the other buttons
//accessed like controls.aiFirst or controls.reload
const controls = {X:"",O:""};

//no return or params
//picks an open button and sets it as the AIs mark
//always sets aiFirst button to disabled
const aiGo = () => {
  
  let availableSpace = []
  for(let i =0; i< 3; i++ ){
    for(let j = 0; j < 3; j++){
      if(board[i][j].disable!=true){
        availableSpace.push(board[i][j])
      }
    }
  }
  let rand = Math.floor(Math.random()*availableSpace.length)
  availableSpace[rand].disable=true
  availableSpace[rand].innerHTML=aiStart  

}

//return X, O, or - if game is over
//returns false if game isnt over
const checkEnd = () => {
  //horizontal
  for(let row = 0; row < 3; row++){

    let horizontal = board[row][0].innerHTML
    let vertical = board[0][row].innerHTML
    
    if(board[row][1].innerHTMLinne==horizontal && board[row][2].innerHTML==horizontal && horizontal!= '_'){
      return horizontal
    }else if(board[1][row].innerHTML==vertical && board[2][row].innerHTML== vertical && vertical!= '_'){
      return vertical
    }
  }
  let diaginal = board[0][0].innerHTML
  let leftdiagonal = board[2][0].innerHTML
  if(board[1][1].innerHTML==diaginal&&board[2][2].innerHTML==diaginal&&diaginal!='_'){
    return diaginal

  }else if(board[1][1].innerHTML==leftdiagonal&&board[0][2].innerHTML==leftdiagonal&&leftdiagonal!='_'){
    return leftdiagonal
  }
  return false;

}

//isnt an arrow function because this way it can use 'this' 
//to reference the button clicked.
//
//always sets aiFirst button to disabled
//sets button state (disabled and inner html)
//checks for end state (and possible ends game)
//calls aiGo
//checks for end state (and possible ends game)
const boardOnClick = function(){
  this.innerHTML = playerMark
  this.disable = true

  let winner
  winner = checkEnd()
  if(winner!=false ){
    return endGame(winner)
  }
  aiGo()
  winner = checkEnd()
  if(winner!=false ){
    return endGame(winner)
  }
  aiFirstOnClick.disable = true;
  
}

//changes playerMark global, calls aiGo
const aiFirstOnClick = function() {
  // can set to X. If human goes first he will be X then ai will be O. 
  this.disable = true
  aiGo()

}

//takes in the return of checkEnd (X,O,-) if checkEnd isnt false
//disables all board buttons, shows message of who won (or cat game) in the control node
//using a new div and innerHTML
const endGame = (state)=>{
  const message = document.createElement('div')
  controlsNode.appendChild(message)
  
  for(let i = 0;i<3;i++){
    for(let j = 0;j<3;j++){
       board[i][j].disable=true    
    }
  }
  
  
  if(state=='X'){
    message.innerHTML="You Won"
  }else if(state == 'O'){
    message.innerHTML="AI Won"
  }else if(state=="-"){
    message.innerHTML="Tie"
  }


}

//called when page finishes loading
//populates the boardNode and controlsNode with getElementById calls
//builds out buttons and saves them in the board global array
//and adds them into the boardNode
//builds out buttons and saves them in control assoc array
//and adds them into controlsNode
//attaches the functions above as button.onclick as appropriate
const load = ()=>{
    boardNode = document.getElementById("board")
    controlsNode = document.getElementById("controls")
    const resetOnClick = ()=>{
      location.reload()
    }
    
    for(let i = 0; i < 3; i++){
        const row = []
        board.push(row)
        const rowDiv = document.createElement('div')
        boardNode.appendChild(rowDiv)
        for (let j = 0; j < 3; j++){
            const button = document.createElement('button')
            button.innerHTML="_"
            button.onclick = boardOnClick
            rowDiv.appendChild(button)
            row.push(button)
        }
    }
    const reloadNode = document.createElement("button")
    reloadNode.innerHTML="Reload"
    controlsNode.appendChild(reloadNode)
    reloadNode.onclick = resetOnClick


    const controlsDiv = document.createElement('div')
    controlsNode.appendChild(controlsDiv)

    const aiButton = document.createElement("button")
    aiButton.innerHTML = "AI_First"
    controlsNode.appendChild(aiButton)
    aiButton.onclick = aiFirstOnClick
  
}

//this says 'when the page finishes loading call my load function'
window.addEventListener("load", load)