import React, { useState, useEffect } from 'react';

function App() {
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [solvedBoard, setSolvedBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [selectedCell, setSelectedCell] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [incorrectCells, setIncorrectCells] = useState(Array(9).fill().map(() => Array(9).fill(false)));
  const [isFinished, setIsFinished] = useState(false);
  const [numberCounts, setNumberCounts] = useState(Array(10).fill(0)); // 0-9, 0 is unused
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState(Array(9).fill().map(() => Array(9).fill().map(() => Array(10).fill(false))));

  const updateNumberCounts = (newBoard) => {
    const counts = Array(10).fill(0);
    newBoard.forEach(row => {
      row.forEach(cell => {
        if (cell !== 0) {
          counts[cell]++;
        }
      });
    });
    setNumberCounts(counts);
  };

  const resetGame = () => {
    const solved = generateSolvedBoard();
    setSolvedBoard(solved);
    const puzzle = generatePuzzle(solved);
    setBoard(puzzle);
    setSelectedCell(null);
    setMistakes(0);
    setIsSolving(false);
    setIncorrectCells(Array(9).fill().map(() => Array(9).fill(false)));
    setNotes(Array(9).fill().map(() => Array(9).fill().map(() => Array(10).fill(false))));
    updateNumberCounts(puzzle);
  };

  // function to check if a number can be placed in a cell
  function isValid(board, row, col, num) {
    // check row and column
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num || board[x][col] === num) return false;
    }

    // check 3x3 subgrid
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[startRow + i][startCol + j] === num) return false;
      }
    }

    return true;
  }

  // function to solve the Sudoku board using backtracking
  function solveSudoku(board, depth = 0) {
    const MAX_DEPTH = 1000;
    if (depth > MAX_DEPTH) return false;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          nums.sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (solveSudoku(board, depth + 1)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function generateSolvedBoard() {
    const board = Array(9).fill().map(() => Array(9).fill(0));
    solveSudoku(board);
    return board;
  }

  // function to generate a new Sudoku puzzle
  function generatePuzzle(solvedBoard) {
    // create a copy of the solved board
    const board = solvedBoard.map(row => [...row]);
    
    // remove x numbers to create the puzzle
    const cellsToRemove = 45; 
    let removed = 0;
    
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);

      if (board[row][col] !== 0) {
        const temp = board[row][col];
        board[row][col] = 0;

        const boardCopy = board.map(row => [...row]);
        if (solveSudoku(boardCopy)) {
          removed++;
        } else {
          board[row][col] = temp;
        }
      }
    }

    return board;
  }

  useEffect(() => {
    const solved = generateSolvedBoard();
    setSolvedBoard(solved);
    const puzzle = generatePuzzle(solved);
    setBoard(puzzle);
    updateNumberCounts(puzzle);
  }, []);

  useEffect(() => {
    if (mistakes >= 3) {
      showSolution();
    }
  }, [mistakes]);

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
  };

  const checkCompletion = (newBoard) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (newBoard[row][col] === 0 || newBoard[row][col] !== solvedBoard[row][col]) {
          return false;
        }
      }
    }
    return true;
  };

  const handleNumberInput = (number) => {
    if(isSolving) return;
    if (selectedCell) {
      const newBoard = [...board];
      
      if(newBoard[selectedCell.row][selectedCell.col] === solvedBoard[selectedCell.row][selectedCell.col]) {
        return;
      }

      if (notesMode) {
        const newNotes = notes.map(row => row.map(col => [...col]));
        newNotes[selectedCell.row][selectedCell.col][number] = !newNotes[selectedCell.row][selectedCell.col][number];
        setNotes(newNotes);
        return;
      }
      
      const newIncorrectCells = incorrectCells.map(row => [...row]);
      
      if (solvedBoard[selectedCell.row][selectedCell.col] === number || number === 0) {
        newIncorrectCells[selectedCell.row][selectedCell.col] = false;
      } else {
        newIncorrectCells[selectedCell.row][selectedCell.col] = true;
        setMistakes(mistakes + 1);
      }
      
      newBoard[selectedCell.row][selectedCell.col] = number;
      setBoard(newBoard);
      setIncorrectCells(newIncorrectCells);
      updateNumberCounts(newBoard);

      // clear notes when placing a number
      const newNotes = notes.map(row => row.map(col => [...col]));
      newNotes[selectedCell.row][selectedCell.col] = Array(10).fill(false);
      setNotes(newNotes);

      // check if the puzzle is complete
      if (checkCompletion(newBoard)) {
        setIsFinished(true);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (selectedCell && e.key >= '1' && e.key <= '9') {
      handleNumberInput(parseInt(e.key));
    }
    if (e.key === 'Backspace') {
      handleNumberInput(0);
    }
  };

  const getHighlightClass = (row, col) => {
    if (!selectedCell || isSolving) {
      return '';
    }
    
    const { row: selectedRow, col: selectedCol } = selectedCell;
    const selectedNumber = board[selectedRow][selectedCol];
    
    if (row === selectedRow && col === selectedCol) {
      return incorrectCells[row][col] ? 'text-red-500 bg-gray-900 hover:bg-gray-900' : 'bg-gray-900 transition-colors duration-100 hover:bg-gray-900';
    }
    
    if (incorrectCells[row][col]) {
        return 'text-red-500 bg-gray-800';
      }
    
    if (selectedNumber !== 0 && board[row][col] === selectedNumber) {
      return 'bg-indigo-500';
    }
    
    const sameRow = row === selectedRow;
    const sameCol = col === selectedCol;
    const subgridRow = Math.floor(row / 3);
    const subgridCol = Math.floor(col / 3);
    const selectedSubgridRow = Math.floor(selectedRow / 3);
    const selectedSubgridCol = Math.floor(selectedCol / 3);
    const sameSubgrid = subgridRow === selectedSubgridRow && subgridCol === selectedSubgridCol;
    
    if (sameRow || sameCol || sameSubgrid) {
      return 'bg-indigo-400';
    }

    return '';
  };

  // handle key presses
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedCell]);

  const showSolution = async () => {
    setIsSolving(true);
    setSelectedCell(null);
    setIncorrectCells(Array(9).fill().map(() => Array(9).fill(false))); 
    const boardCopy = board.map(row => [...row]);
    
    // go through each cell and fill in the solution
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (boardCopy[row][col] === 0 || incorrectCells[row][col]) {
          boardCopy[row][col] = solvedBoard[row][col];
          setBoard([...boardCopy]);
          updateNumberCounts(boardCopy);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    
    setIsSolving(false);
  };

  return (
    <div className="select-none min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8" onClick={() => setSelectedCell(null)}>
      <h1 className="text-5xl font-bold">Sudoku</h1>
      <h2 className="text-sm">Mistakes left: {3-mistakes}</h2>
      {isFinished && (
        <div className="mt-4 p-1 bg-green-600 rounded-lg text-center">
          <h2 className="text-lg font-bold">Congratulations!</h2>
        </div>
      )}
      <div className="mt-10 grid grid-cols-9 gap-px bg-gray-700 p-2 border-2 border-gray-700 mb-4 w-full max-w-[550px] aspect-square" onClick={(e) => e.stopPropagation()}>
        {board.map((row, rowIndex) => (
          <>
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-full h-full flex items-center justify-center text-3xl font-bold
                  bg-gray-800 hover:bg-gray-700 cursor-pointer aspect-square relative
                  ${getHighlightClass(rowIndex, colIndex)}
                  ${(rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? 'border-b-2 border-gray-600' : ''}
                  ${(colIndex + 1) % 3 === 0 && colIndex !== 8 ? 'border-r-2 border-gray-600' : ''}
                `}
                onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
              >
                {cell !== 0 ? cell : (
                  <div className="grid grid-cols-3 gap-0.5 w-full h-full p-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((noteNum) => (
                      <div
                        key={noteNum}
                        className={`text-xs flex items-center justify-center ${
                          notes[rowIndex][colIndex][noteNum] ? 'text-cyan-400' : 'text-transparent'
                        }`}
                      >
                        {noteNum}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        ))}
      </div>

      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${
            notesMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          onClick={(e) => {setNotesMode(!notesMode); e.stopPropagation();}}
        >
          Notes {notesMode ? 'On' : 'Off'}
        </button>
      </div>

      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-4 justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            className={`w-12 h-12 sm:w-16 sm:h-16 text-xl sm:text-2xl font-bold bg-gray-800 hover:bg-gray-700 
                     border border-gray-600 rounded-md transition-colors
                     ${numberCounts[num] === 9 ? 'opacity-0 pointer-events-none' : ''}`}
            onClick={(e) => {e.stopPropagation(); handleNumberInput(num)}}

            disabled={isSolving}
          >
            {num}
          </button>
        ))}
        <button className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 text-xl sm:text-2xl font-bold bg-red-600 hover:bg-red-400 border border-gray-600 rounded-md transition-colors " onClick={() => handleNumberInput(0)}>
          <span className="material-symbols-outlined align-middle">close</span>
        </button>
      </div>

      <div className="flex gap-4 mt-4">
        <button 
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md transition-colors"
          onClick={showSolution}
          disabled={isSolving}
        >
          {isSolving ? 'Solving...' : 'Give Up'}
        </button>
        <button 
          className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md transition-colors"
          onClick={resetGame}
        >
          New Game
        </button>
      </div>
    </div>
  );
}

export default App;
