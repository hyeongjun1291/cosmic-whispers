import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateSaju } from '../src/lib/saju';
import { shuffleTarotDeck, TAROT_CARDS } from '../src/lib/tarotData';

test('ordinary lunar dates produce the same pillars as the equivalent solar date', () => {
    assert.deepEqual(
        calculateSaju(2023, 2, 1, 12, 0, true),
        calculateSaju(2023, 2, 20, 12, 0),
    );
});

test('a lunar leap month maps to its own solar date', () => {
    assert.deepEqual(
        calculateSaju(2023, 2, 1, 12, 0, true, true),
        calculateSaju(2023, 3, 22, 12, 0),
    );
});

test('shuffling keeps all 78 cards and leaves the source deck untouched', () => {
    const original = TAROT_CARDS.map(card => card.id);
    const shuffled = shuffleTarotDeck();
    assert.notEqual(shuffled, TAROT_CARDS);
    assert.equal(shuffled.length, 78);
    assert.deepEqual(shuffled.map(card => card.id).sort(), [...original].sort());
    assert.deepEqual(TAROT_CARDS.map(card => card.id), original);
});
