(() => {
  'use strict';

  const EXPERTS = [
    {name:'SMYTH', picks:[
      ['1.01','Jahmyr Gibbs'],['2.12','Nico Collins'],['3.01','Malik Nabers'],['4.12','Cam Skattebo'],['5.01','Bucky Irving'],['6.12','Harold Fannin Jr.'],['7.01','Marvin Harrison Jr.'],['8.12','Caleb Williams'],['9.01','KC Concepcion'],['10.12','Jalen Coker'],['11.01','Jakobi Meyers'],['12.12','Brandon Aubrey'],['13.01','Houston Texans'],['14.12','Kyler Murray'],['15.01','Ray Davis']
    ]},
    {name:'GARVIN', picks:[
      ['1.02','Bijan Robinson'],['2.11','George Pickens'],['3.02','Travis Etienne Jr.'],['4.11','Jameson Williams'],['5.02','Parker Washington'],['6.11','Tony Pollard'],['7.02','Jonathon Brooks'],['8.11','Dalton Kincaid'],['9.02','Matthew Golden'],['10.11','Jared Goff'],['11.02','Tre Tucker'],['12.11','Dylan Sampson'],['13.02','Jake Ferguson'],['14.11','Jaxson Dart'],['15.02','Kayshon Boutte']
    ]},
    {name:'BOONE', highlight:true, picks:[
      ['1.03','Jonathan Taylor'],['2.10','Drake London'],['3.03','Chris Olave'],['4.10','Colston Loveland'],['5.03','Christian Watson'],['6.10','MarShawn Lloyd'],['7.03','Jalen Hurts'],['8.10','George Kittle'],['9.03','Kenny Gainwell'],['10.10','Jordyn Tyson'],['11.03','Tyler Allgeier'],['12.10','Tyjae Spears'],['13.03','Los Angeles Rams'],['14.10','Jake Bates'],['15.03','Chris Bell']
    ]},
    {name:'TITUS', picks:[
      ['1.04',"Ja'Marr Chase"],['2.09','Ashton Jeanty'],['3.04','DeVonta Smith'],['4.09','Jadarian Price'],['5.04','DJ Moore'],['6.09','J.K. Dobbins'],['7.04','Blake Corum'],['8.09','Quentin Johnston'],['9.04','Dak Prescott'],['10.09','Travis Kelce'],['11.04','Jalen McMillan'],['12.09','Kaelon Black'],['13.04','Cameron Dicker'],['14.09','Denver Broncos'],['15.04','Tyler Shough']
    ]},
    {name:'EDHOLM', picks:[
      ['1.05','Puka Nacua'],['2.08','A.J. Brown'],['3.05','Javonte Williams'],['4.08','Trey McBride'],['5.05','Quinshon Judkins'],['6.08','Joe Burrow'],['7.05','Carnell Tate'],['8.08','Rico Dowdle'],['9.05','Jordan Addison'],['10.08','Rachaad White'],['11.05','Rashid Shaheed'],['12.08','Zach Charbonnet'],['13.05','Ryan Flournoy'],['14.08','Patrick Mahomes'],['15.05','Brenton Strange']
    ]},
    {name:'PIANOWSKI', picks:[
      ['1.06','Amon-Ra St. Brown'],['2.07','Kyren Williams'],['3.06','Zay Flowers'],['4.07','Luther Burden III'],['5.06','David Montgomery'],['6.07','TreVeyon Henderson'],['7.06','Courtland Sutton'],['8.07','Jordan Mason'],['9.06',"Wan'Dale Robinson"],['10.07','Juwan Johnson'],['11.06','Brock Purdy'],['12.07','Emmett Johnson'],['13.06','Los Angeles Chargers'],['14.07','Jordan Love'],['15.06','Will Reichard']
    ]},
    {name:'LOEB', picks:[
      ['1.07','Christian McCaffrey'],['2.06','Brock Bowers'],['3.07','Josh Allen'],['4.06','Davante Adams'],['5.07','Rome Odunze'],['6.06','Jaylen Warren'],['7.07','Alec Pierce'],['8.06','Jacory Croskey-Merritt'],['9.07','Makai Lemon'],['10.06','Trevor Lawrence'],['11.07','Xavier Worthy'],['12.06','Brian Robinson'],['13.07','Cam Little'],['14.06','Jacksonville Jaguars'],['15.07','Tank Dell']
    ]},
    {name:'HARMON', picks:[
      ['1.08','James Cook III'],['2.05','Derrick Henry'],['3.08','Jaylen Waddle'],['4.05','Emeka Egbuka'],['5.08','Tyler Warren'],['6.05','Brian Thomas Jr.'],['7.08','Michael Wilson'],['8.05','Josh Downs'],['9.08','Justin Herbert'],['10.05','Mike Washington Jr.'],['11.08','Aaron Jones Sr.'],['12.05','Dontayvion Wicks'],['13.08','Jaylin Noel'],['14.05','Eddy Pineiro'],['15.08','Pittsburgh Steelers']
    ]},
    {name:'WINKS', picks:[
      ['1.09','Jaxon Smith-Njigba'],['2.04',"De'Von Achane"],['3.09','Jeremiyah Love'],['4.04','Garrett Wilson'],['5.09','Terry McLaurin'],['6.04','Mike Evans'],['7.09','Chuba Hubbard'],['8.04','Jayden Daniels'],['9.09','Josh Jacobs'],['10.04','Isaiah Likely'],['11.09','Keaton Mitchell'],['12.04',"Ka'imi Fairbairn"],['13.09','Bo Nix'],['14.04','Terrance Ferguson'],['15.09',"Ja'Kobi Lane"]
    ]},
    {name:'NORRIS', picks:[
      ['1.10','Saquon Barkley'],['2.03','Kenneth Walker III'],['3.10','Tee Higgins'],['4.03','Breece Hall'],['5.10','Sam LaPorta'],['6.03','Drake Maye'],['7.10','DK Metcalf'],['8.03',"De'Zhaun Stribling"],['9.10','Michael Pittman Jr.'],['10.03','Stefon Diggs'],['11.10','Woody Marks'],['12.03','Denzel Boston'],['13.10','Jason Myers'],['14.03','Seattle Seahawks'],['15.10','Adonai Mitchell']
    ]},
    {name:'FRITON', picks:[
      ['1.11','CeeDee Lamb'],['2.02','Omarion Hampton'],['3.11','Rashee Rice'],['4.02','Tetairoa McMillan'],['5.11','Bhayshul Tuten'],['6.02','Rhamondre Stevenson'],['7.11','Kyle Monangai'],['8.02','Kyle Pitts Sr.'],['9.11','Romeo Doubs'],['10.02','Jonah Coleman'],['11.11','Braelon Allen'],['12.02','Matthew Stafford'],['13.11','Tyrone Tracy Jr.'],['14.02','Harrison Mevis'],['15.11','New England Patriots']
    ]},
    {name:'ALLEN', picks:[
      ['1.12','Justin Jefferson'],['2.01','Chase Brown'],['3.12','Ladd McConkey'],['4.01',"D'Andre Swift"],['5.12','Lamar Jackson'],['6.01','Tucker Kraft'],['7.12','Chris Godwin Jr.'],['8.01','Jayden Reed'],['9.12','RJ Harvey'],['10.01','Chris Rodriguez Jr.'],['11.12','Tank Bigsby'],['12.01','Dallas Goedert'],['13.12','Deebo Samuel Sr.'],['14.01','Philadelphia Eagles'],['15.12','Evan McPherson']
    ]}
  ];

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const board=document.getElementById('expertBoard');
  const nav=document.getElementById('expertJump');

  nav.innerHTML=EXPERTS.map(e=>`<a href="#expert-${e.name.toLowerCase()}" class="${e.highlight?'boone':''}">${esc(e.name)}</a>`).join('');
  board.innerHTML=EXPERTS.map(expert=>`<article class="expert-card ${expert.highlight?'boone-card':''}" id="expert-${expert.name.toLowerCase()}">
    <header><div><span>EXPERT</span><h2>${esc(expert.name)}</h2></div>${expert.highlight?'<b class="boone-badge">FOCUS</b>':''}</header>
    <div class="expert-pick-list">${expert.picks.map(([pick,player])=>`<div class="expert-pick"><b>${esc(pick)}</b><span>${esc(player)}</span></div>`).join('')}</div>
  </article>`).join('');
})();
