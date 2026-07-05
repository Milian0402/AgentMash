import {
  getActiveItem,
  state
} from "./state.js?v=61";
import {
  clearSwipeIntent,
  elements
} from "./render.js?v=61";

let dragState = null;
let audioContext = null;

export function installGestureHandlers({ decide, choosePairwise, undoLastComparison, undoLastReview, isDecisionLocked }) {
  elements.swipeCard.addEventListener("pointerdown", onPointerDown);
  elements.swipeCard.addEventListener("pointermove", onPointerMove);
  elements.swipeCard.addEventListener("pointerup", (event) => onPointerUp(event, decide));
  elements.swipeCard.addEventListener("pointercancel", (event) => onPointerUp(event, decide));

  window.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea, select")) {
      return;
    }

    if (isDecisionLocked()) {
      event.preventDefault();
      return;
    }

    if (state.reviewMode === "pairwise") {
      const key = event.key.toLowerCase();
      if (event.key === "ArrowLeft" || key === "a") {
        event.preventDefault();
        choosePairwise("left");
        return;
      }

      if (event.key === "ArrowRight" || key === "l") {
        event.preventDefault();
        choosePairwise("right");
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        undoLastComparison();
        return;
      }
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      decide("nice", "keyboard");
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      decide("pass", "keyboard");
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undoLastReview();
    }
  });
}

function onPointerDown(event) {
  if (event.target.closest("button, input, textarea, select, a")) {
    return;
  }

  if (document.body.dataset.decisionTransition === "true") {
    return;
  }

  if (!getActiveItem()) {
    return;
  }

  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    currentX: event.clientX,
    samples: [{ x: event.clientX, t: event.timeStamp }]
  };
  elements.swipeCard.setPointerCapture(event.pointerId);
  elements.swipeCard.classList.add("is-dragging");
}

function onPointerMove(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }

  dragState.currentX = event.clientX;
  dragState.samples.push({ x: event.clientX, t: event.timeStamp });
  while (dragState.samples.length > 1 && event.timeStamp - dragState.samples[0].t > 100) {
    dragState.samples.shift();
  }

  const deltaX = dragState.currentX - dragState.startX;
  const rotation = Math.max(-12, Math.min(12, deltaX / 18));
  const isNice = deltaX > 70;
  const isPass = deltaX < -70;
  const progress = Math.min(1, Math.abs(deltaX) / 140);

  elements.swipeCard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
  elements.swipeCard.style.setProperty("--drag-progress", `${progress}`);
  elements.swipeCard.classList.toggle("swipe-nice", isNice);
  elements.swipeCard.classList.toggle("swipe-pass", isPass);
  elements.acceptButton.classList.toggle("is-hot", isNice);
  elements.rejectButton.classList.toggle("is-hot", isPass);
  document.body.dataset.swipeIntent = isNice ? "nice" : isPass ? "pass" : "";
  elements.swipeBadge.textContent = isNice ? "Nice" : isPass ? "Nope" : "";
}

function onPointerUp(event, decide) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }

  const deltaX = dragState.currentX - dragState.startX;
  const flickVelocity = measureFlickVelocity(event);
  dragState = null;
  elements.swipeCard.classList.remove("is-dragging", "swipe-nice", "swipe-pass");
  clearSwipeIntent();

  if (event.type !== "pointercancel") {
    if (deltaX > 120 || (deltaX > 70 && flickVelocity > 0.5)) {
      decide("nice", "swipe");
      return;
    }

    if (deltaX < -120 || (deltaX < -70 && flickVelocity < -0.5)) {
      decide("pass", "swipe");
      return;
    }
  }

  elements.swipeBadge.textContent = "";
  elements.swipeCard.style.transform = "";
  elements.swipeCard.style.removeProperty("--drag-progress");
}

function measureFlickVelocity(event) {
  const oldest = dragState.samples[0];
  const elapsed = event.timeStamp - oldest.t;
  if (elapsed <= 0) {
    return 0;
  }

  return (event.clientX - oldest.x) / elapsed;
}

export function pulseDevice(kind = "decision") {
  playDecisionClick(kind);

  if (!navigator.vibrate) {
    return;
  }

  const patterns = {
    nice: [8, 22, 14],
    pass: [18],
    pairwise: [10, 18, 10],
    decision: [12]
  };
  navigator.vibrate(patterns[kind] || patterns.decision);
}

function playDecisionClick(kind) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return;
  }

  try {
    audioContext ||= new AudioContext();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequencies = {
      nice: [260, 360],
      pass: [180, 120],
      pairwise: [220, 300],
      decision: [220, 180]
    };
    const [startFrequency, endFrequency] = frequencies[kind] || frequencies.decision;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + 0.035);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.022, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.06);
  } catch {
    audioContext = null;
  }
}
