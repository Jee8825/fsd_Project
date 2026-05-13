import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { extractTimerMinutes, scaleIngredient } from '../../utils/helpers';

const formatClock = (totalSeconds) => {
  const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const ss = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
};

const useWakeLock = (active) => {
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return undefined;
    let cancelled = false;
    const request = async () => {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        sentinelRef.current = null;
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      sentinelRef.current?.release?.().catch(() => {});
      sentinelRef.current = null;
    };
  }, [active]);
};

const CookMode = ({ open, recipe, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(() => new Set());
  const [servings, setServings] = useState(recipe?.servings || 4);
  const [largeText, setLargeText] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setCompleted(new Set());
      setServings(recipe?.servings || 4);
      setTimerSeconds(0);
      setTimerRunning(false);
    }
  }, [open, recipe]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = window.setInterval(() => {
      setTimerSeconds((value) => {
        if (value <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useWakeLock(open);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setStepIndex((value) => Math.min(value + 1, (recipe?.instructions?.length || 1) - 1));
      if (event.key === 'ArrowLeft') setStepIndex((value) => Math.max(value - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, recipe]);

  const scale = recipe ? servings / (recipe.servings || servings) : 1;
  const scaledIngredients = useMemo(
    () => (recipe ? recipe.ingredients.map((ingredient) => scaleIngredient(ingredient, scale)) : []),
    [recipe, scale],
  );

  if (!recipe) return null;

  const instructions = recipe.instructions || [];
  const totalSteps = instructions.length;
  const currentStep = instructions[stepIndex] || '';
  const suggestedTimer = extractTimerMinutes(currentStep);

  const toggleComplete = (index) => {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const startSuggestedTimer = () => {
    if (suggestedTimer) {
      setTimerSeconds(suggestedTimer * 60);
      setTimerRunning(true);
    }
  };

  const adjustTimer = (deltaSeconds) => {
    setTimerSeconds((value) => Math.max(0, value + deltaSeconds));
  };

  const progress = totalSteps ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`cook-mode ${largeText ? 'cook-mode--large' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <header className="cook-mode__header">
            <div>
              <p className="eyebrow">Cook mode</p>
              <h2>{recipe.title}</h2>
            </div>
            <div className="cook-mode__header-actions">
              <button type="button" className="button button--ghost" onClick={() => setLargeText((v) => !v)}>
                {largeText ? 'Standard text' : 'Large text'}
              </button>
              <button type="button" className="icon-button" onClick={onClose} aria-label="Exit cook mode">
                ×
              </button>
            </div>
          </header>

          <div className="cook-mode__progress">
            <div className="cook-mode__progress-bar" style={{ width: `${progress}%` }} />
          </div>

          <div className="cook-mode__body">
            <aside className="cook-mode__sidebar">
              <div className="cook-mode__panel">
                <h3>Servings</h3>
                <div className="cook-mode__servings">
                  <button type="button" onClick={() => setServings((v) => Math.max(1, v - 1))} aria-label="Decrease servings">
                    −
                  </button>
                  <strong>{servings}</strong>
                  <button type="button" onClick={() => setServings((v) => v + 1)} aria-label="Increase servings">
                    +
                  </button>
                </div>
                <small>Original: {recipe.servings} servings • amounts auto-scale</small>
              </div>

              <div className="cook-mode__panel">
                <h3>Ingredients</h3>
                <ul className="cook-mode__ingredients">
                  {scaledIngredients.map((ingredient) => (
                    <li key={ingredient.name}>
                      <span>
                        {ingredient.amount || ''} {ingredient.unit}
                      </span>
                      <strong>{ingredient.name}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="cook-mode__panel">
                <h3>Timer</h3>
                <div className="cook-mode__timer">{formatClock(timerSeconds)}</div>
                <div className="button-row">
                  <button
                    type="button"
                    className="button button--primary button--small"
                    onClick={() => setTimerRunning((v) => !v)}
                    disabled={timerSeconds === 0 && !timerRunning}
                  >
                    {timerRunning ? 'Pause' : 'Start'}
                  </button>
                  <button type="button" className="button button--ghost button--small" onClick={() => adjustTimer(60)}>
                    +1 min
                  </button>
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    onClick={() => {
                      setTimerSeconds(0);
                      setTimerRunning(false);
                    }}
                  >
                    Reset
                  </button>
                </div>
                {suggestedTimer ? (
                  <button
                    type="button"
                    className="cook-mode__timer-suggest"
                    onClick={startSuggestedTimer}
                  >
                    Start {suggestedTimer}-min timer from this step
                  </button>
                ) : (
                  <small className="muted-text">No time mentioned in this step.</small>
                )}
              </div>
            </aside>

            <main className="cook-mode__stage">
              <div className="cook-mode__step-meta">
                <span>
                  Step {stepIndex + 1} of {totalSteps}
                </span>
                <label className="cook-mode__check">
                  <input
                    type="checkbox"
                    checked={completed.has(stepIndex)}
                    onChange={() => toggleComplete(stepIndex)}
                  />
                  <span>Mark complete</span>
                </label>
              </div>

              <motion.p
                key={stepIndex}
                className="cook-mode__instruction"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep}
              </motion.p>

              <div className="cook-mode__nav">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setStepIndex((v) => Math.max(0, v - 1))}
                  disabled={stepIndex === 0}
                >
                  ← Previous
                </button>
                {stepIndex < totalSteps - 1 ? (
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => {
                      toggleComplete(stepIndex);
                      setStepIndex((v) => Math.min(totalSteps - 1, v + 1));
                    }}
                  >
                    Next step →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => {
                      toggleComplete(stepIndex);
                      onClose();
                    }}
                  >
                    Finish cooking
                  </button>
                )}
              </div>

              <ol className="cook-mode__step-rail">
                {instructions.map((_, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      className={`cook-mode__step-dot ${index === stepIndex ? 'active' : ''} ${
                        completed.has(index) ? 'done' : ''
                      }`}
                      onClick={() => setStepIndex(index)}
                      aria-label={`Go to step ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
              </ol>
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookMode;
