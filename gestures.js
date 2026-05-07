import {
  getActiveItem,
  state
} from "./state.js";
import {
  clearSwipeIntent,
  elements
} from "./render.js";

let dragState = null;

export function installGestureHandlers({ decide, choosePairwise, undoLastComparison, undoLastReview }) {
  elements.swipeCard.addEventListener("pointerdown", onPointerDown);
  elements.swipeCard.addEventListener("pointermove", onPointerMove);
  elements.swipeCard.addEventListener("pointerup", (event) => onPointerUp(event, decide));
  elements.swipeCard.addEventListener("pointercancel", (event) => onPointerUp(event, decide));

  window.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea, select")) {
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
      decide("nice");
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      decide("pass");
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

  if (!getActiveItem()) {
    return;
  }

  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    currentX: event.clientX
  };
  elements.swipeCard.setPointerCapture(event.pointerId);
  elements.swipeCard.classList.add("is-dragging");
}

function onPointerMove(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }

  dragState.currentX = event.clientX;
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
  dragState = null;
  elements.swipeCard.classList.remove("is-dragging", "swipe-nice", "swipe-pass");
  clearSwipeIntent();

  if (deltaX > 120) {
    decide("nice");
    return;
  }

  if (deltaX < -120) {
    decide("pass");
    return;
  }

  elements.swipeBadge.textContent = "";
  elements.swipeCard.style.transform = "";
  elements.swipeCard.style.removeProperty("--drag-progress");
}

export function pulseDevice() {
  if (navigator.vibrate) {
    navigator.vibrate(12);
  }
}
