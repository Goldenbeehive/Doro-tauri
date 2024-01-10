"use strict";
import { invoke } from "@tauri-apps/api";
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';
let permissionGranted = await isPermissionGranted();
if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
}

const pomo_notif = () => {
    if (permissionGranted) {
        sendNotification({ title: 'Timer Ended!', body: 'Your Pomo timer has ended!', sound: "default" });
    }
}
const sbreak_notif = () => {
    if (permissionGranted) {
        sendNotification({ title: 'Timer Ended!', body: 'Your Short Break timer has ended!', sound: "default" });
    }
}
const lbreak_notif = () => {
    if (permissionGranted) {
        sendNotification({ title: 'Timer Ended!', body: 'Your Long Break timer has ended!', sound: "default" });
    }
}
// Global state vars
let paused = false;
const TimerModes = {
    POMO: 'POMO',
    SBREAK: 'SBREAK',
    LBREAK: 'LBREAK'
};
let currentTimerMode = TimerModes.POMO
let startOrPause = 0; // 0 start 1 pause 2 continue
let numOfPomos = 0;
// Title bar events
var close = document.getElementById('close')
var max = document.getElementById('max')
var min = document.getElementById('min')
close
    .addEventListener("click", () => invoke('close_window', { window: Window }));
max
    .addEventListener("click", () => invoke('max_window', { window: Window }));
min
    .addEventListener("click", () => invoke('min_window', { window: Window }));


// Bottom Button events
// Edit
const editbutton = document.getElementById('editbutton')
const edit = document.getElementById('edit')
editbutton.addEventListener('click', () => {

    edit.contentEditable = true;
    edit.classList.add('editing');
    edit.focus();
    const textLength = edit.textContent.length;
    window.getSelection().collapse(edit.firstChild, textLength)
})
edit.addEventListener('keydown', (event) => {
    const content = edit.textContent;
    if (content.length > 60) {
        edit.textContent = content.slice(0, 60)
    }
    if (event.key === 'Enter') {
        edit.contentEditable = false;
        edit.classList.remove('editing')

    }
});
// Start - Pause
let countdown;
let timeLeftInSeconds;
let timerPausedAt;
let secondsLeft;
const startButton = document.getElementById('pause')
const timerDisplay = document.getElementById('timing')
const gradientBox = document.querySelector('.gradient-box')
const timerPercentage = document.getElementById('percentage-text')
const timerStateText = document.getElementById('timerStateText')
const timerModeText = document.getElementById('timerMode')
const state = document.getElementById('collection')

function startTimer(durationInMinutes) {
    const now = Date.now();
    const then = now + durationInMinutes * 60 * 1000

    timeLeftInSeconds = durationInMinutes * 60
    displayTimeLeft(timeLeftInSeconds, then);
    updateGradientBoxWidth(timeLeftInSeconds, durationInMinutes)
    countdown = setInterval(() => {
        secondsLeft = Math.round((then - Date.now()) / 1000)

        if (secondsLeft < 0) {
            clearInterval(countdown);
            displayTimeLeft(timeLeftInSeconds, then);
            updateGradientBoxWidth(timeLeftInSeconds, durationInMinutes)
            timerEnded();
            reverseAnimation();
            return;
        }

        timeLeftInSeconds = secondsLeft;
        displayTimeLeft(timeLeftInSeconds, then);
        updateGradientBoxWidth(timeLeftInSeconds, durationInMinutes);
    }, 1000);
}

function pauseTimer() {
    clearInterval(countdown);
    timerPausedAt = secondsLeft
}

function resumeTimer() {  
    startTimer(timerPausedAt/60);   
}


function displayTimeLeft(seconds, endTime) {
    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = seconds % 60;
    const end = getEndTime(endTime);
    const display = `${end} - ${minutes}m${remainderSeconds}s`;
    timerDisplay.textContent = display;
}

function getEndTime(endTime) {
    const end = new Date(endTime);
    const hours = end.getHours();
    const minutes = end.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes}${ampm}`;
}

function timerEnded() {
    endTimerIfExists();
    if (currentTimerMode === TimerModes.POMO) {
        if (numOfPomos !== 3) {
            currentTimerMode = TimerModes.SBREAK;
        } else {
            currentTimerMode = TimerModes.LBREAK;
            numOfPomos = 0;
        }
        pomo_notif()
        numOfPomos++;
    } else if (currentTimerMode === TimerModes.SBREAK || currentTimerMode === TimerModes.LBREAK) {
        currentTimerMode === TimerModes.SBREAK ? sbreak_notif() : lbreak_notif()
        currentTimerMode = TimerModes.POMO;

    }

    if (currentTimerMode === TimerModes.POMO) {
        timerModeText.textContent = "Pomo";
    } else if (currentTimerMode === TimerModes.SBREAK) {
        timerModeText.textContent = "S Break";
    } else if (currentTimerMode === TimerModes.LBREAK) {
        timerModeText.textContent = "L Break";
    }
    startOrPause = 0;
    timerStateText.textContent = "Start"


}
function updateGradientBoxWidth(seconds, durationInMinutes) {
    const totalSeconds = durationInMinutes * 60;
    let percentage = ((totalSeconds - seconds) / totalSeconds) * 80;
    let realPercentage = ((totalSeconds - seconds) / totalSeconds) * 100;
    realPercentage = realPercentage.toFixed(0)
    timerPercentage.textContent = `${realPercentage}%`
    gradientBox.style.width = `${percentage}%`;

}
function endTimerIfExists() {
    if (countdown) {
        clearInterval(countdown);
        countdown = undefined;
        timeLeftInSeconds = 0;
        timerPausedAt = undefined;
    }
}
let prevstate = {
    mode: TimerModes.POMO,
    state: 0
}
function updatePrevState(state) {
    prevstate.state = state
}
startButton.addEventListener('click', () => {
    startResetAnimation();
    if (startOrPause == 0) // start
    {
        timerStateText.textContent = "Pause"
        if (currentTimerMode == TimerModes.POMO) {
            endTimerIfExists()
            startTimer(25)
        }
        if (currentTimerMode == TimerModes.SBREAK) {
            endTimerIfExists()
            startTimer(5)
        }
        if (currentTimerMode == TimerModes.LBREAK) {
            endTimerIfExists()
            startTimer(10)
        }
        startOrPause = 1
        updatePrevState(1)
        return;
    }
    if (startOrPause == 1) // pause
    {
        timerStateText.textContent = "Continue"
        pauseTimer()
        startOrPause = 2
        updatePrevState(2)
        return;
    }
    if (startOrPause == 2) // Continue
    {
        timerStateText.textContent = "Pause"
        resumeTimer()
        startOrPause = 1
        updatePrevState(1)
        return;
    }

})
// reset
let reset = document.getElementById('reset')

function startResetAnimation() {
    document.getElementById('reset').classList.remove('revstartResetAnimation');
    document.getElementById('reset-collection').classList.remove('revstartResetCollectionAnimation');
    reset.addEventListener('click', () => {
        startOrPause = 1
        timerStateText.textContent = "Pause"
        if (currentTimerMode == TimerModes.POMO) {
            endTimerIfExists()
            startTimer(25)
            return;
        }
        if (currentTimerMode == TimerModes.SBREAK) {
            endTimerIfExists()
            startTimer(5)
            return;
        }
        if (currentTimerMode == TimerModes.LBREAK) {
            endTimerIfExists()
            startTimer(10)
            return;
        }
    })
   
    document.getElementById('reset').classList.add('startResetAnimation');
    document.getElementById('reset-collection').classList.add('startResetCollectionAnimation');
  }

function reverseAnimation() {
    document.getElementById('reset').classList.remove('startResetAnimation');
    document.getElementById('reset-collection').classList.remove('startResetCollectionAnimation');
    document.getElementById('reset').classList.add('revstartResetAnimation');
    document.getElementById('reset-collection').classList.add('revstartResetCollectionAnimation');
  }

 
 