const readlineSync = require("readline-sync");

const main = () => {
  // number of players over all rounds should be divided by 2, so every player in every round has an opponent
  // since the number of players should not be more than 64, numbers that are always divided by 2 that make the tournament valid are the following
  // 2 is not in the arr since that only makes final happen
  const N = readlineSync.question("Unos broja tenisera. Izaberite jedan od ponudjenih brojeva - ( 4, 8, 16, 32, 64 ) => ");
  const playersNumberValidationResult = playersNumberValidation(N);
  if(!playersNumberValidationResult) {
    return;
  }

  const players = displayingPlayers();

  const tempChosenPlayerNumbers = readlineSync.question(`\nUnesite redne brojeve ${playersNumberValidationResult} tenisera u obliku [broj],[broj].. => `);
  const chosenPlayerNumbers = tempChosenPlayerNumbers.split(",");
  const playersValidationResult = playersValidation(chosenPlayerNumbers, N);
  if(!playersValidationResult) {
    return;
  }

  const tennisPlayers = [];
  for(let i = 0; i < chosenPlayerNumbers.length; i++) {
    for(let j = 0; j < players.length; j++) {
      if(parseInt(chosenPlayerNumbers[i]) === players[j].ranking) {
        tennisPlayers.push(players[j]);
        break;
      }
    }
  }

  const pairedPlayers = pairingPlayersFirstRound(tennisPlayers); 

  tournamentSimulation(pairedPlayers);
};

const displayingPlayers = () => {
  const players = require('./players.json');
  
  players.forEach((el, index) => {
    console.log(`${index + 1}. ${el.firstName} ${el.lastName} (${el.country}, ${el.ranking})`);
  });

  return players;
}

const playersNumberValidation = N => {
  const playersNumber = parseInt(N);
  const availableNumbers = [4, 8, 16, 32, 64];

  if(!availableNumbers.includes(playersNumber)) {
    console.log("Niste odabrali neki od ponudjenih brojeva. Pokrenite program ponovo. \n");
    return false;
  }

  return playersNumber;
}

const playersValidation = (inputNumbers, N) => {


  if(inputNumbers.length !== parseInt(N)) {
    console.log("Niste uneli broj tenisera koji je bio predvidjen. Pokrenite program ponovo.\n");
    return false;
  }

  for(let i = 0; i < inputNumbers.length; i++) {
    const num1 = parseInt(inputNumbers[i]);

    if(isNaN(num1)) {
      console.log("Redni broj tenisera nije validan broj. Pokrenite program ponovo.\n");
      return false;
    }

    if(num1 < 1 || num1 > 64) {
      console.log("Redni broj tenisera treba da bude u rasponu 1 - 64. Pokrenite program ponovo.\n");
      return false;
    }

    for(let j = i+1; j < inputNumbers.length; j++) {
      if(inputNumbers[i] === inputNumbers[j]) {
        console.log("Ne mozete uneti broj istog tenisera vise puta. Pokrenite program ponovo.\n");
        return false;
      }
    }
  }

  

  return true;
}

const tournamentSimulation = players => {
  let roundNumber = 1;
 
  while(true) {
    if(players.length === 2) {
      console.log(`\nRound ${roundNumber} / Semifinals:`);
    } else if(players.length === 1) {
      console.log(`\nFinal:`);
    } else {
      console.log(`\nRound ${roundNumber}: `);
    }

    // tournament rounds
    // when we get to final we are left with [[p1:p2]]
    players.forEach((pair, index) => {
      const matchResults = matchSimulation(pair);

      displayingMatchResults(matchResults, index);

      // player who lost is removed
      if(matchResults.player1.sets !== 3) {
        pair.splice(0, 1);
      } else {
        pair.splice(1, 1);
      }
    })

    // after the final we are left with [[player]]
    if(players.length === 1) {
      break;
    }
  
    // new array is created from players who won, since its one player left in every arr
    let newPlayers = [];
    players.forEach(el => {
      newPlayers.push(el[0]);
    })
  
    // then players are paired up again
    players = newPlayers;
    players = pairingPlayers(players);

    roundNumber++;
  }

  const winner = players[0][0];
  console.log(`\nWinner:`);
  console.log(`\t !!! ${winner.firstName[0]}. ${winner.lastName} (${winner.country}, ${winner.ranking}) !!!`);
}

const displayingMatchResults = (matchResults, index) => {
  const player1 = matchResults.player1;
  const player2 = matchResults.player2;

  let player1SetResults = ' '
  player1.setResults.forEach(el => {
    player1SetResults += `${el} `
  })

  let player2SetResults = ' '
  player2.setResults.forEach(el => {
    player2SetResults += `${el} `
  })

  console.log(
  `${index+1}. ${player1.firstName[0]}. ${player1.lastName} (${player1.country}, ${player1.ranking}) - Sets => ${player1.sets} (${player1SetResults})\n` +  
  `   ${player2.firstName[0]}. ${player2.lastName} (${player2.country}, ${player2.ranking}) - Sets => ${player2.sets} (${player2SetResults})`
  );
}

const updateScore = (match, playerGotPoint, playerDidntGetPoint) => {
  match[playerGotPoint].points++;

  // one player needs to win at least 4 points but at the same time the other player needs to have at least 2 points less
  // 1 = 15, 2 = 30, 3 = 40, 4 = win
  if(match[playerGotPoint].points === 4 && match[playerDidntGetPoint].points < 3) {
    match[playerGotPoint].games++;

    match.player1.points = 0;
    match.player2.points = 0;
  } else if(match.player1.points === 3 && match.player2.points === 3) {
    const playerThatWon = deuceResolution();

    if(playerThatWon === 1) {
      match.player1.games++;

      match.player1.points = 0;
      match.player2.points = 0;
    } else {
      match.player2.games++;

      match.player1.points = 0;
      match.player2.points = 0;
    }
  }

  // one player needs to win at least 6 games to win a set, but at the same time the other player needs to have at least 2 games less
  if(match[playerGotPoint].games >= 6 && match[playerDidntGetPoint].games <= match[playerGotPoint].games - 2) {
    match[playerGotPoint].sets++;

    match[playerGotPoint].setResults.push(match[playerGotPoint].games)
    match[playerDidntGetPoint].setResults.push(match[playerDidntGetPoint].games)

    match.player1.points = 0;
    match.player2.points = 0;

    match.player1.games = 0;
    match.player2.games = 0;
  }

  return match;
}

const matchSimulation = pair => {
  let match = {
    player1: {
      ranking: pair[0].ranking,
      firstName: pair[0].firstName,
      lastName: pair[0].lastName,
      country: pair[0].country,
      points: 0,
      games: 0,
      sets: 0,
      setResults: []
    },
    player2: {
      ranking: pair[1].ranking,
      firstName: pair[1].firstName,
      lastName: pair[1].lastName,
      country: pair[1].country,
      points: 0,
      games: 0,
      sets: 0,
      setResults: []
    }
  }

  while(true) {
    if(match.player1.sets === 3 || match.player2.sets === 3) {
      break;
    }

    if(Math.random() < 0.5) {
      const updatedScore = updateScore(match, "player1", "player2")
      match = updatedScore;

    } else {
      const updatedScore = updateScore(match, "player2", "player1")
      match = updatedScore;
    }
  }

  return match;
}

const pairingPlayersFirstRound = players => {
  // sort needs a callback function in order to sort objects properly by ranking
  // if returned number is less than 0 p1 should be before p2, more than 0 p1 and p2 switch places, if its 0 they remain on their places
  players.sort((p1, p2) => p1.ranking - p2.ranking);

  // we need to iterate "players.length / 2" times cause we are taking two items from an array in every loop - first and last, second and second to last..
  const iterationTimes = players.length / 2;
  // until we reach middle 4 items left - then we pair first and third, second and fourth and we break out of loop
  const reachedMiddleFour = iterationTimes - 2;

  const playerPairs = [];
  for(let i = 0; i < iterationTimes; i++) {
    if(reachedMiddleFour === i) {
      playerPairs.push([
        players[i],
        players[i+2]
      ]);

      playerPairs.push([
        players[i+1],
        players[i+3]
      ]);

      break;

    } else {
      playerPairs.push([
        players[i],
        players[players.length - i - 1]
      ]);
    }
  }

  return playerPairs;
}

const pairingPlayers = players => {
  const playerPairs = []
  for(let i = 0; i < players.length / 2; i++) {
    playerPairs.push([
      players[i],
      players[players.length - i - 1]
    ])
  }

  return playerPairs;
}

const deuceResolution = () => {
  let p1 = 0;
  let p2 = 0;

  while(true) {
    if(Math.random() < 0.5) {
      p1++;

      if(p1 === 2 && p2 === 0) {
        return 1;
      } else if(p1 === p2) {
        p1 = 0;
        p2 = 0;
      }

    } else {
      p2++;

      if(p2 === 2 && p1 === 0) {
        return 2;
      } else if(p1 === p2) {
        p1 = 0;
        p2 = 0;
      }
    }
  }
}


main();