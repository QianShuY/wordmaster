"""Original looping 6/8 journey miniature, synthesized locally; no external samples."""
from pathlib import Path
import wave
import numpy as np

SR = 22050
BEAT = 60 / 84 / 3  # eighth note, dotted-quarter tempo
BAR = BEAT * 6
DURATION = BAR * 32
rng = np.random.default_rng(1729)
mix = np.zeros((round(DURATION * SR), 2), dtype=np.float64)

def note(midi, at, duration, level, voice, pan=0):
    t = np.arange(round(duration * SR)) / SR
    f = 440 * 2 ** ((midi - 69) / 12)
    if voice == 'lute':
        # Soft, inharmonic plucked courses with quicker decay of upper partials.
        y = sum(np.sin(2*np.pi*f*k*(1+.00009*k*k)*t + k*.21)
                * np.exp(-t*(1.65+k*.8)) / k**1.7 for k in range(1, 9))
        y *= np.minimum(t/.008, 1) * np.minimum((duration-t)/.12, 1)
    elif voice == 'flute':
        vibrato = .0018 * np.sin(2*np.pi*4.8*t) * np.minimum(t/.7, 1)
        phase = 2*np.pi*f*np.cumsum(1+vibrato)/SR
        y = np.sin(phase)+.13*np.sin(phase*2)+.035*np.sin(phase*3)
        y *= np.minimum(t/.13, 1)*np.minimum((duration-t)/.23, 1)
        y *= .88+.12*np.sin(np.pi*t/duration)
    else:
        y = (np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*f*1.0015*t)
             +.15*np.sin(2*np.pi*f*2*t))
        y *= np.minimum(t/.7, 1)*np.minimum((duration-t)/.8, 1)
    y *= level
    p = np.array([np.sqrt((1-pan)/2), np.sqrt((1+pan)/2)])
    start = round(at*SR)
    indices = (start+np.arange(len(y))) % len(mix)
    mix[indices] += y[:, None]*p

# D Dorian: open fifths and gentle modal movement, without martial percussion.
chords = [(50,57,62,65),(48,55,60,64),(43,55,59,62),(50,57,62,65),
          (46,53,58,62),(48,55,60,64),(45,57,60,64),(50,57,62,65)]
melody = [
 [(69,0,3),(72,3,2),(74,5,1)],[(76,0,4),(74,4,2)],
 [(71,0,3),(69,3,3)],[(67,0,2),(69,2,2),(74,4,2)],
 [(77,0,3),(74,3,3)],[(76,0,2),(74,2,2),(72,4,2)],
 [(69,0,4)],[(74,0,5)],
 [(74,0,2),(76,2,1),(77,3,3)],[(76,0,3),(72,3,3)],
 [(74,0,3),(71,3,2)],[(69,0,3),(67,3,3)],
 [(65,0,3),(69,3,3)],[(67,0,2),(72,2,4)],
 [(69,0,3),(72,3,2)],[(74,0,5)]
]
for bar in range(32):
    chord = chords[bar % 8]
    at = bar*BAR
    for step, tone in enumerate([chord[0],chord[2],chord[3],chord[1],chord[2],chord[3]]):
        note(tone, at+step*BEAT+rng.uniform(-.008,.008), 2.5,
             .075*(1 if step in (0,3) else .7), 'lute', -.25)
    for tone in [chord[0]-12, chord[1]]:
        note(tone, at, BAR+1.1, .024, 'strings', .2)
    # Leave space for the landscape in the intro and between phrases.
    if 4 <= bar < 28:
        for tone, step, length in melody[(bar-4)%16]:
            note(tone, at+step*BEAT+.025, length*BEAT*.92, .062, 'flute', .15)

# Circular stereo early reflections create a seamless room tail at the loop boundary.
dry = mix.copy()
for delay, gain in [(.117,.15),(.233,.11),(.389,.075),(.613,.045),(.827,.025)]:
    mix += np.roll(dry, round(delay*SR), axis=0)[:, ::-1]*gain
mix *= .72 / float(np.max(np.abs(mix)))
out = Path(__file__).resolve().parents[1]/'static/adventure/assets/first-light-on-the-road.wav'
with wave.open(str(out), 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SR)
    wav.writeframes((mix*32767).astype('<i2').tobytes())
print(f'{out}: {DURATION:.1f}s, peak {np.max(np.abs(mix)):.3f}')
