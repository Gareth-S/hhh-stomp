/*----------------------------------------------------------*/
/* Beat Engine v0                                            */
/*----------------------------------------------------------*/

let currentBeat = -1;
let beatInterval = 1000;


function configureBeatEngine(tempo)
{
    if (!tempo)
    {
        return;
    }

    if (tempo.bpm)
    {
        beatInterval = 60000 / tempo.bpm;
      
        console.log("Beat interval =", beatInterval);
  }

    if (tempo.countInBars)
    {
        countInBars = tempo.countInBars;
    }

    if (tempo.timeSignature)
    {
        timeSignature = tempo.timeSignature;
    }

}



function initialiseBeatButton()
{
    const button =
        document.getElementById("tempo-button");

    if (!button)
    {
        return;
    }

    button.addEventListener(
        "click",
        startBeatEngine
    );
    
    startBeatEngine();

    updateBeatDisplay();
}

function nextBeat()
{
    currentBeat++;

    if (currentBeat > 3)
    {
        currentBeat = 0;
    }

    updateBeatDisplay();
}

function updateBeatDisplay()
{
    const leds =
        document.querySelectorAll(".beat-led");

    for (let i = 0; i < leds.length; i++)
    {
        if (i <= currentBeat)
        {
            leds[i].classList.add("active");
        }
        else
        {
            leds[i].classList.remove("active");
        }
    }
}

// start engine

let beatTimer = null;

function startBeatEngine()
{
    if (beatTimer)
    {
        clearInterval(beatTimer);
    }

    currentBeat = -1;

    nextBeat();

    beatTimer =
        setInterval(nextBeat, beatInterval);
}

