/*----------------------------------------------------------*/
/* Beat Engine v0                                            */
/*----------------------------------------------------------*/

let currentBeat = -1;
let beatInterval = 1000;
let useMasterClock = false;

/*----------------------------------------------------------*/
/* Clock Source                                              */
/*----------------------------------------------------------*/

/*
 * V1
 * ----
 * The Beat Engine is driven by the local device clock.
 *
 * V2
 * ----
 * If a hotspot master clock is available:
 *
 *   1. Join hotspot.
 *   2. Synchronise local clock.
 *   3. Wait for next global beat 1.
 *   4. Start local count-in.
 *
 * If the hotspot disappears:
 *
 *   - Continue using the local clock.
 *   - Restart from the next button press.
 *
 * The Beat Engine itself should never know
 * where the timing comes from.
 */




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

    console.log("Button =", button);

    if (!button)
    {
        return;
    }

    button.addEventListener(
        "click",
        function ()
        {
            console.log("Tempo button clicked");

            startBeatEngine();
        }
    );

    updateBeatDisplay();
}


function nextBeat()
{
    currentBeat++;

    if (currentBeat > 3)
    {
        currentBeat = 0;

        currentBar++;

        barsRemaining--;
    }

    updateBeatDisplay();
    console.log( "Bar", currentBar, "Beat", currentBeat + 1, "Remaining",barsRemaining);

    if (barsRemaining <= 0)
    {
        clearInterval(beatTimer);

        beatTimer = null;
        
        showReady();

        console.log("READY");

        return;
    }
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

/*----------------------------------------------------------*/
/* Beat Engine                                               */
/*----------------------------------------------------------*/

/*
 * NOTE
 * ----
 * V2 will introduce a Clock Manager.
 *
 * Instead of calling startBeatEngine()
 * directly, the Clock Manager will decide
 * when the Beat Engine begins.
 *
 * Local clock:
 *      start immediately.
 *
 * Hotspot clock:
 *      wait for next global beat 1.
 */


// start engine

let beatTimer = null;

let currentBar = 0;
let barsRemaining = 4;

/*

function startBeatEngine()
{
    if (beatTimer)
    {
        clearInterval(beatTimer);
    }

    currentBeat = -1;
    nextBeat();
    beatTimer = setInterval(nextBeat, beatInterval);
        
    currentBar = 1;
    barsRemaining = countInBars;

}

*/

function startBeatEngine()
{
    if (beatTimer)
    {
        clearInterval(beatTimer);
    }

    document.getElementById("tempo-status").textContent = "";

    currentBeat = -1;

    currentBar = 1;

    barsRemaining = countInBars;

    nextBeat();

    beatTimer =
        setInterval(
            nextBeat,
            beatInterval
        );
}


/*
 * Placeholder for V2 hotspot synchronisation.
 */

function synchroniseToMasterClock()
{
    /*
     * V2
     *
     * Connect to hotspot.
     * Measure clock drift.
     * Wait for next global beat 1.
     * Then call startBeatEngine().
     */
}

function showReady()
{
    document.getElementById("tempo-status").textContent =
        "READY";
}

function clearReady()
{
    document.getElementById("tempo-status").textContent =
        "";
}
