/*----------------------------------------------------------*/
/* Beat Engine v0                                            */
/*----------------------------------------------------------*/

let currentBeat = -1;
let beatInterval = 1000;
let useMasterClock = false;
let currentTempoBpm = 480;
let currentTimeSignature = "4/4";

 let beatAudioContext = null;

let beatSoundA = null;
let beatSoundB = null;

let previousBeatTime = null;

let nextBeatTime = 0;
let schedulerTimer = null;

const schedulerInterval = 25;
const scheduleAheadTime = 0.1;

let scheduledBeat = 0;
let scheduledBar = 1;
let scheduledBarsRemaining = 0;

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
        currentTempoBpm = tempo.bpm;

        beatInterval = 60000 / tempo.bpm;

        
//        console.log( "Beat interval =", beatInterval);
        
        
    }

    if (tempo.timeSignature)
    {
        currentTimeSignature = tempo.timeSignature;
        timeSignature = tempo.timeSignature;
}

    
    /*
    
    if (tempo.bpm)
    {
        beatInterval = 60000 / tempo.bpm;
      
        console.log("Beat interval =", beatInterval);
  }

     if (tempo.timeSignature)
    {
        timeSignature = tempo.timeSignature;
    }

  */
  
    if (tempo.countInBars)
    {
        countInBars = tempo.countInBars;
    }
    
/*
 * Show the tempo as soon as the song JSON has been loaded.
 */
        showTempoStatus();
 
}

function initialiseBeatButton()
{
    const button = document.getElementById("tempo-button");

    console.log("Button =", button);

    if (!button)
    {
        return;
    }

    button.addEventListener(
        "click",
        async function ()
        {
            console.log("Tempo button clicked");
            
            await initialiseBeatAudio();
            
         //   testBeatSounds();
            
             // Keep the visual beat engine usable
            // even if audio loading fails.

            startBeatEngine();
        }
    );

    updateBeatDisplay();
    
    
    if (
    localStorage.getItem("big-tempo") === "true"
    )
    { flashBigTempo(); }
    
}

// audio

/*
// test oscillator

function initialiseBeatAudio()
{
    if (!beatAudioContext)
    {
        beatAudioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }

    if (
        beatAudioContext.state === "suspended"
    )
    {
        beatAudioContext.resume();
    }
}

*/

// using wavs

async function initialiseBeatAudio()
{
    if (!beatAudioContext)
    {
        beatAudioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }

    if (
        beatAudioContext.state === "suspended"
    )
    {
        await beatAudioContext.resume();
    }

    if (
        beatSoundA &&
        beatSoundB
    )
    {
        return;
    }

    const responseA =
        await fetch(
            "../assets/clicka.wav"
        );

    const responseB =
        await fetch(
            "../assets/clickb.wav"
        );
        
        
    if (!responseA.ok)
    {
        throw new Error(
            "Could not load clicka.wav: " +
            responseA.status
        );
    }

    if (!responseB.ok)
    {
        throw new Error(
            "Could not load clickb.wav: " +
            responseB.status
        );
    }
       

    const bufferA =
        await responseA.arrayBuffer();

    const bufferB =
        await responseB.arrayBuffer();
        
        
//    console.log("clicka.wav bytes:", bufferA.byteLength);

//    console.log("clickb.wav bytes:", bufferB.byteLength);

        
    beatSoundA =
        await beatAudioContext.decodeAudioData(
            bufferA
        );

//            console.log("clicka.wav decoded");

        
        
    beatSoundB =
        await beatAudioContext.decodeAudioData(
            bufferB
        );
        
//         console.log("clickb.wav decoded");
        
        
}


/*

// test oscillator using setInterval()
function playBeatSound(isDownbeat)
{
    if (!beatAudioContext)
    {
        return;
    }

    const oscillator =
        beatAudioContext.createOscillator();

    const gain =
        beatAudioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.value =
        isDownbeat ? 880 : 440;

    gain.gain.setValueAtTime(
        0.15,
        beatAudioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        beatAudioContext.currentTime + 0.08
    );

    oscillator.connect(gain);
    gain.connect(beatAudioContext.destination);

    oscillator.start();

    oscillator.stop(
        beatAudioContext.currentTime + 0.08
    );
}

*/


/*

// using wavs and using setInterval()
function playBeatSound(isDownbeat)
{
    if (
        !beatAudioContext ||
        !beatSoundA ||
        !beatSoundB
    )
    {
        
//        console.log("Beat sounds are not ready");
    
        return;
    }

//    console.log("Playing clicka.wav");

    const source =
        beatAudioContext.createBufferSource();

    source.buffer =
        isDownbeat
            ? beatSoundA
            : beatSoundB;

    source.connect(
        beatAudioContext.destination
    );

    source.start();
}


*/

/*

//test
function testBeatSounds()
{
    if (
        !beatAudioContext ||
        !beatSoundA ||
        !beatSoundB
    )
    {
        console.log("Beat sounds are not ready");
        return;
    }

    console.log("Playing clicka.wav");

    const sourceA =
        beatAudioContext.createBufferSource();

    sourceA.buffer = beatSoundA;

    sourceA.connect(
        beatAudioContext.destination
    );

    sourceA.start();

    setTimeout(
        function ()
        {
            console.log("Playing clickb.wav");

            const sourceB =
                beatAudioContext.createBufferSource();

            sourceB.buffer = beatSoundB;

            sourceB.connect(
                beatAudioContext.destination
            );

            sourceB.start();
        },
        1000
    );
}

*/

// using wavs & web audio
function playBeatSound(
    isDownbeat,
    scheduledTime
)

{
    /*
     * Tempo sound is muted by default.
     * Sound is enabled only when the
     * Settings checkbox has been checked.
     */

    const beatSoundEnabled =
        localStorage.getItem(
            "song2html_beat_sound_enabled"
        ) === "true";

    if (!beatSoundEnabled)
    {
        return;
    }


    if (
        !beatAudioContext ||
        !beatSoundA ||
        !beatSoundB
    )
    {
        return;
    }

    const source =
        beatAudioContext.createBufferSource();

    source.buffer =
        isDownbeat
            ? beatSoundA
            : beatSoundB;

    source.connect(
        beatAudioContext.destination
    );

    
     source.start(
        scheduledTime
    );
    
    
}

function scheduleBeat()
{
    if (
        !beatAudioContext ||
        scheduledBarsRemaining <= 0
    )
    {
        return;
    }

    const beatDuration =
        60 / currentTempoBpm;

    while (
        nextBeatTime <
        beatAudioContext.currentTime +
        scheduleAheadTime
    )
    {
        const isDownbeat =
            scheduledBeat === 0;

        playBeatSound(
            isDownbeat,
            nextBeatTime
        );

        scheduledBeat++;

        if (scheduledBeat > 3)
        {
            scheduledBeat = 0;

            scheduledBar++;

            scheduledBarsRemaining--;
        }

        nextBeatTime += beatDuration;
    }
}

function nextBeat()
{
    const now =
        performance.now();

    if (previousBeatTime !== null)
    {
         //    console.log("Time since previous beat:",(now - previousBeatTime).toFixed(1), "ms");
     }

    previousBeatTime =
        now;

    currentBeat++;

    if (currentBeat > 3)
    {
        currentBeat = 0;

        currentBar++;

        barsRemaining--;
    }

    updateBeatDisplay();

    if (barsRemaining <= 0)
    {
        clearInterval(beatTimer);

        beatTimer = null;

        if (schedulerTimer)
        {
            clearInterval(schedulerTimer);

            schedulerTimer = null;
        }

        showTempoStatus();

        console.log("Count-in complete");

        return;
    }
}


/*

function nextBeat()
{
    
    
    const now =
    performance.now();

if (previousBeatTime !== null)
{
//    console.log("Time since previous beat:",(now - previousBeatTime).toFixed(1), "ms");
}

previousBeatTime =
    now;
    
    
    currentBeat++;

    if (currentBeat > 3)
    {
        currentBeat = 0;

        currentBar++;

        barsRemaining--;
    }

 //   playBeatSound( currentBeat === 0 );
    
 //   playBeatSound(false);
//    playBeatSound(true);


    updateBeatDisplay();
    
//    console.log( "Bar", currentBar, "Beat", currentBeat + 1, "Remaining",barsRemaining);

    if (barsRemaining <= 0)
    {
        clearInterval(beatTimer);

        beatTimer = null;
        
        
        showTempoStatus();

        console.log( "Count-in complete");
        
        /*
        
        showReady();

        console.log("READY");

        */
        /*
        
        return;
    }
}

*/
        
        
/*
// duplicate

function scheduleBeat()
{
    if (
        !beatAudioContext
    )
    {
        return;
    }

    const beatDuration =
        60 / currentTempoBpm;

    while (
        nextBeatTime <
        beatAudioContext.currentTime +
        scheduleAheadTime
    )
    {
        const isDownbeat =
            currentBeat === 0;

        playBeatSound(
            isDownbeat,
            nextBeatTime
        );

        nextBeatTime += beatDuration;
    }
}

*/

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

    if (
        localStorage.getItem("big-tempo") === "true"
    )
    {
        flashBigTempo();
    }
}

function flashBigTempo()
{
    document.body.classList.add(
        "big-tempo-flash"
    );

    setTimeout(function ()
    {
        document.body.classList.remove(
            "big-tempo-flash"
        );
    }, 120);
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


function startBeatEngine()
{
    if (beatTimer)
    {
        clearInterval(beatTimer);
    }

    if (schedulerTimer)
    {
        clearInterval(schedulerTimer);
    }


    /*
    document.getElementById("tempo-status").textContent = "";
    */
    
    
    currentBeat = -1;

    currentBar = 1;

    barsRemaining = countInBars;
    
    previousBeatTime = null;
    
    
        /*
    Reset the audio scheduler.
    */

    scheduledBeat = 0;

    scheduledBar = 1;

    scheduledBarsRemaining =
        countInBars;

    nextBeatTime =
        beatAudioContext.currentTime +
        0.05;

    /*
    Start the visual/count-in engine.
    */


    nextBeat();

    beatTimer =
        setInterval(
            nextBeat,
            beatInterval
        );
        
    
     /*
    Start the Web Audio scheduler.
    */

    schedulerTimer =
        setInterval(
            scheduleBeat,
            schedulerInterval
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


/*
 * Show the current song tempo while the beat engine is idle.
 */
function showTempoStatus()
{
    document.getElementById(
        "tempo-status"
    ).textContent =
        currentTempoBpm +
        " BPM • " +
        currentTimeSignature;
}


/*

function showReady()
{
    document.getElementById("tempo-status").textContent =
        "READY";
}

*/


function clearReady()
{
    document.getElementById("tempo-status").textContent =
        "";
}

/*----------------------------------------------------------*/
/* Big  Tempo                                              */
/*----------------------------------------------------------*/


function flashBigTempo()
{
    document.body.classList.add(
        "big-tempo-flash"
    );

    setTimeout(function ()
    {
        document.body.classList.remove(
            "big-tempo-flash"
        );
    }, beatInterval * 0.4);
}
