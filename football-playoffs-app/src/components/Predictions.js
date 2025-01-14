import React, { useState, useEffect } from "react";

const Predictions = () => {
  const initialGames = [
    {
      id: 1,
      match: "Los Angeles Chargers (LAC) vs Houston Texans (HOU)",
      spread: "Chargers 2.5",
      overUnder: 47,
      options: ["LAC", "HOU"],
      selectedTeam: "",
      selectedOverUnder: "",
    },
    {
      id: 2,
      match: "Pittsburgh Steelers (PIT) vs Baltimore Ravens (BAL)",
      spread: "Baltimore Ravens 9.5",
      overUnder: 45,
      options: ["PIT", "BAL"],
      selectedTeam: "",
      selectedOverUnder: "",
    },
    {
      id: 3,
      match: "Denver Broncos (DEN) vs Buffalo Bills (BUF)",
      spread: "Buffalo Bills 8.5",
      overUnder: 42,
      options: ["DEN", "BUF"],
      selectedTeam: "",
      selectedOverUnder: "",
    },
    {
      id: 4,
      match: "Green Bay Packers (GB) vs Philadelphia Eagles (PHI)",
      spread: "Philadelphia Eagles 5.5",
      overUnder: 43,
      options: ["GB", "PHI"],
      selectedTeam: "",
      selectedOverUnder: "",
    },
    {
      id: 5,
      match: "Washington Commanders (WAS) vs Tampa Bay Buccaneers (TB)",
      spread: "Tampa Bay Buccaneers win by 3",
      overUnder: 44,
      options: ["WAS", "TB"],
      selectedTeam: "",
      selectedOverUnder: "",
    },
    {
      id: 6,
      match: "Minnesota Vikings vs Los Angeles Rams",
      spread: "Minnesota Vikings win by 7",
      overUnder: 49,
      options: ["MIN", "LAR"],
      selectedTeam: "",
      selectedOverUnder: "",
    },
  ];

  // Load saved data from localStorage
  const loadFromLocalStorage = (key, defaultValue) => {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  };

  const [userPicks, setUserPicks] = useState(() =>
    loadFromLocalStorage("userPicks", initialGames)
  );
  const [nfcChampion, setNfcChampion] = useState(() =>
    loadFromLocalStorage("nfcChampion", "")
  );
  const [afcChampion, setAfcChampion] = useState(() =>
    loadFromLocalStorage("afcChampion", "")
  );
  const [superBowlChampion, setSuperBowlChampion] = useState(() =>
    loadFromLocalStorage("superBowlChampion", "")
  );

  // Save data to localStorage on state updates
  useEffect(() => {
    localStorage.setItem("userPicks", JSON.stringify(userPicks));
    localStorage.setItem("nfcChampion", JSON.stringify(nfcChampion));
    localStorage.setItem("afcChampion", JSON.stringify(afcChampion));
    localStorage.setItem("superBowlChampion", JSON.stringify(superBowlChampion));
  }, [userPicks, nfcChampion, afcChampion, superBowlChampion]);

  // Handle team pick
  const handlePick = (gameId, team) => {
    setUserPicks((prevState) =>
      prevState.map((game) =>
        game.id === gameId ? { ...game, selectedTeam: team } : game
      )
    );
  };

  // Handle over/under pick
  const handleOverUnderPick = (gameId, choice) => {
    setUserPicks((prevState) =>
      prevState.map((game) =>
        game.id === gameId ? { ...game, selectedOverUnder: choice } : game
      )
    );
  };

  // Handle submission
  const handleSubmit = () => {
    console.log("User Picks:", userPicks);
    console.log("NFC Champion:", nfcChampion);
    console.log("AFC Champion:", afcChampion);
    console.log("Super Bowl Champion:", superBowlChampion);
    alert("Your predictions have been submitted!");
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">NFL Wild Card Pick'em</h2>

      <div className="list-group">
        {userPicks.map((game, index) => (
          <div
            key={index}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <h5>{game.match}</h5>
              <p>
                <strong>Spread:</strong> {game.spread}
              </p>
              <p>
                <strong>Over/Under:</strong> {game.overUnder} points
              </p>
            </div>

            <div>
              <h6>Pick a winner:</h6>
              {game.options.map((team, i) => (
                <button
                  key={i}
                  className={`btn btn-outline-primary m-1 ${
                    game.selectedTeam === team ? "active" : ""
                  }`}
                  onClick={() => handlePick(game.id, team)}
                >
                  {team}
                </button>
              ))}
              <h6>Over/Under:</h6>
              {["Over", "Under"].map((choice, i) => (
                <button
                  key={i}
                  className={`btn btn-outline-secondary m-1 ${
                    game.selectedOverUnder === choice ? "active" : ""
                  }`}
                  onClick={() => handleOverUnderPick(game.id, choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <h4>NFC and AFC Champions</h4>
        <div className="mb-3">
          <label htmlFor="nfcChampion" className="form-label">
            NFC Champion:
          </label>
          <select
            value={nfcChampion}
            onChange={(e) => setNfcChampion(e.target.value)}
            className="form-select mb-3"
          >
            <option value="">Select NFC Champion</option>
            {[
              "Detroit Lions",
              "Philadelphia Eagles",
              "Tampa Bay Buccaneers",
              "Minnesota Vikings",
              "Green Bay Packers",
              "Washington Commanders",
              "Los Angeles Rams",
            ].map((team, i) => (
              <option key={i} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="afcChampion" className="form-label">
            AFC Champion:
          </label>
          <select
            value={afcChampion}
            onChange={(e) => setAfcChampion(e.target.value)}
            className="form-select mb-3"
          >
            <option value="">Select AFC Champion</option>
            {[
              "Kansas City Chiefs",
              "Buffalo Bills",
              "Baltimore Ravens",
              "Houston Texans",
              "Pittsburgh Steelers",
              "Los Angeles Chargers",
              "Denver Broncos",
            ].map((team, i) => (
              <option key={i} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="superBowlChampion" className="form-label">
            Super Bowl Champion:
          </label>
          <input
            id="superBowlChampion"
            type="text"
            className="form-control"
            placeholder="Enter Super Bowl Champion"
            value={superBowlChampion}
            onChange={(e) => setSuperBowlChampion(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        <h4>Your Picks:</h4>
        {userPicks.map((game, index) => (
          <p key={index}>
            <strong>{game.match}</strong> - Team:{" "}
            {game.selectedTeam || "No pick yet"}, Over/Under:{" "}
            {game.selectedOverUnder || "No pick yet"}
          </p>
        ))}
      </div>
      <button className="btn btn-success mt-4" onClick={handleSubmit}>
        Submit Picks
      </button>
    </div>
  );
};

export default Predictions;
