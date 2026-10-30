const currencies = [
  {code:"USD",name:"US Dollar",price:15,holding:0,change:0},
  {code:"EUR",name:"Euro",price:16,holding:0,change:0},
  {code:"YEN",name:"Yen × 100",price:10,holding:0,change:0}
];

const difficulties = {
  easy:{
    name:"EASY",
    target:40000,
    rival:12000
  },
  medium:{
    name:"MEDIUM",
    target:80000,
    rival:30000
  },
  hard:{
    name:"HARD",
    target:140000,
    rival:55000
  }
};

let selectedDifficulty = "easy";
let target = 40000;
let playerName = "Player";

let cash = 10000;
let turn = 1;
let factories = 0;
let tech = 1;
let rate = 5;
let nusaIndex = 100;
let rivalIndex = 100;
let rivalWealth = 12000;
let reserves = 0;
let ended = false;
let started = false;
let history = [];
let lastNews = "Market opened.";

const el = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString("id-ID");
const money = n => fmt(n)+" cr";

// DIFFICULTY SELECTION
function selectDifficulty(level){
  selectedDifficulty = level;

  ["easy","medium","hard"].forEach(id=>{
    el(id).classList.toggle("selected",id===level);
  });
}

// START GAME
function startGame(){
  const name = el("playerName").value.trim();

  if(!name){
    alert("Please enter your player name!");
    return;
  }

  playerName = name;
  const config = difficulties[selectedDifficulty];

  target = config.target;
  rivalWealth = config.rival;

  cash = 10000;
  turn = 1;
  factories = 0;
  tech = 1;
  rate = 5;
  nusaIndex = 100;
  rivalIndex = 100;
  reserves = 0;
  ended = false;
  started = true;
  history = [];

  currencies.forEach(c=>{
    c.holding=0;
    c.change=0;
  });

  currencies[0].price=15;
  currencies[1].price=16;
  currencies[2].price=10;

  lastNews="Your government has officially taken power.";

  el("startScreen").style.display="none";
  el("gameArea").style.display="block";

  el("playerLabel").textContent=playerName;
  el("difficultyLabel").textContent=config.name;
  el("targetLabel").textContent=money(target);

  log("President "+playerName+" started the game.");
  render();

  window.scrollTo(0,0);
}

// CALCULATE TOTAL WEALTH
function netWorth(){
  return cash+reserves+
    currencies.reduce((sum,c)=>sum+c.holding*c.price,0)+
    factories*1500+(tech-1)*800;
}

function log(text){
  history.unshift("Round "+turn+": "+text);
  history=history.slice(0,18);
  el("log").innerHTML=history.map(x=>"• "+x).join("<br>");
}

// UPDATE DISPLAY
function render(){
  if(!started)return;

  el("cash").textContent=money(cash);
  el("wealth").textContent=money(netWorth());
  el("turn").textContent=Math.min(turn,20)+" / 20";
  el("index").textContent=nusaIndex.toFixed(1);

  el("factories").textContent=factories;
  el("income").textContent=money(factories*450*tech);
  el("tech").textContent="Level "+tech;
  el("rate").textContent=rate+"%";
  el("reserves").textContent=money(reserves);
  el("rivalWealth").textContent=money(rivalWealth);
  el("rivalIndex").textContent=rivalIndex.toFixed(1);

  el("news").textContent=lastNews;

  const percent=Math.min(100,netWorth()/target*100);

  el("progress").style.width=percent+"%";
  el("progressText").textContent=
    money(netWorth())+" / "+money(target)+
    " ("+percent.toFixed(1)+"%)";

  el("rivalProgress").textContent=
    "Rival wealth: "+money(rivalWealth)+
    " | Your lead: "+money(netWorth()-rivalWealth);

  el("market").innerHTML=currencies.map((c,i)=>`
    <tr>
      <td><b>${c.code}</b><br>
      <span class="muted">${c.name}</span></td>
      <td>
        ${c.price.toFixed(2)} cr<br>
        <span class="${c.change>=0?'up':'down'}">
          ${c.change>=0?'+':''}${c.change.toFixed(2)}%
        </span><br>
        <span class="muted">Owned: ${fmt(c.holding)}</span>
      </td>
      <td>
        <button onclick="trade(${i},1)" ${ended?'disabled':''}>Buy 10</button>
        <button class="red" onclick="trade(${i},-1)"
          ${ended||c.holding<10?'disabled':''}>Sell 10</button>
      </td>
    </tr>
  `).join("");

  el("next").disabled=ended;
}

// CURRENCY TRADING
function trade(i,direction){
  if(ended)return;

  const c=currencies[i];
  const units=10;
  const value=c.price*units;
  const fee=value*0.01;

  if(direction===1){
    if(cash<value+fee){
      lastNews="Not enough cash to buy currency.";
      render();return;
    }

    cash-=value+fee;
    c.holding+=units;
    log("Bought 10 "+c.code+".");
  }else{
    if(c.holding<units)return;

    c.holding-=units;
    cash+=value-fee;
    log("Sold 10 "+c.code+".");
  }

  render();
}

// BUSINESS
function buildFactory(){
  if(ended)return;

  if(cash<2500){
    lastNews="Not enough cash to build a factory.";
    render();return;
  }

  cash-=2500;
  factories++;

  log("Built a new factory.");
  render();
}

function upgradeTech(){
  if(ended)return;

  const cost=2000*tech;

  if(cash<cost){
    lastNews="Not enough cash for research.";
    render();return;
  }

  cash-=cost;
  tech++;

  log("Technology upgraded to level "+tech+".");
  render();
}

// CENTRAL BANK
function changeRate(delta){
  if(ended)return;

  if(cash<300){
    lastNews="Not enough cash for policy changes.";
    render();return;
  }

  if(rate+delta<1||rate+delta>12){
    lastNews="Interest rate must be between 1% and 12%.";
    render();return;
  }

  cash-=300;
  rate+=delta;

  log("Interest rate changed to "+rate+"%.");
  render();
}

function intervene(){
  if(ended)return;

  if(cash<1000){
    lastNews="Not enough cash for intervention.";
    render();return;
  }

  cash-=1000;
  reserves+=1000;
  nusaIndex+=3;

  log("Central bank intervened in the currency market.");
  render();
}

// RANDOM ECONOMIC EVENTS
function nextTurn(){
  if(ended)return;

  const businessIncome=factories*450*tech;

  cash+=businessIncome;
  cash+=Math.max(0,cash)*rate/100/4;

  const events=[
    {text:"Export boom! Nusa currency strengthens.",nusa:3,market:-1,rival:-1},
    {text:"Global crisis! Investors seek safe assets.",nusa:-4,market:5,rival:-3},
    {text:"Foreign investment enters Nusa.",nusa:4,market:-2,rival:-1},
    {text:"Inflation rises and purchasing power weakens.",nusa:-3,market:3,rival:0},
    {text:"Export demand increases.",nusa:2,market:1,rival:2},
    {text:"The market remains relatively stable.",nusa:0,market:0,rival:0}
  ];

  const event=events[Math.floor(Math.random()*events.length)];

  lastNews=event.text;

  nusaIndex+=event.nusa+(rate-5)*0.35+
    (Math.random()-0.5)*3;

  nusaIndex=Math.max(50,Math.min(160,nusaIndex));

  rivalIndex+=event.rival+(Math.random()-0.5)*5;
  rivalIndex=Math.max(50,Math.min(160,rivalIndex));

  currencies.forEach(c=>{
    const old=c.price;

    c.price*=1+(event.market/100)+
      (Math.random()-0.5)*0.12+
      (rate-5)*-0.002;

    c.price=Math.max(2,Math.min(40,c.price));
    c.change=(c.price-old)/old*100;
  });

  rivalWealth*=1+(Math.random()*0.035-0.005);
  rivalWealth+=event.rival*80;

  turn++;

  log(lastNews);

  // WIN CONDITION
  if(netWorth()>=target && netWorth()>rivalWealth){
    finish(true,"You reached your wealth target and defeated Borealia!");
    return;
  }

  // TIME LIMIT
  if(turn>20){
    finish(false,"The 20-round time limit has ended.");
    return;
  }

  render();
}

// GAME END
function finish(win,text){
  ended=true;

  el("endPanel").style.display="block";

  el("endTitle").textContent=win?
    "🏆 ECONOMIC VICTORY!":
    "📉 GAME OVER";

  el("endText").innerHTML=`
    <b>President ${playerName}</b><br><br>
    ${text}<br><br>
    Difficulty: ${difficulties[selectedDifficulty].name}<br>
    Wealth target: ${money(target)}<br>
    Your final wealth: ${money(netWorth())}<br>
    Borealia's wealth: ${money(rivalWealth)}<br><br>
    ${win?"You are now an economic superpower!":
    "Your country failed to achieve its economic goals."}
  `;

  el("phase").textContent=win?"Economic victory!":"Simulation ended";

  render();

  el("endPanel").scrollIntoView({behavior:"smooth"});
}
