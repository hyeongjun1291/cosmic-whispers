'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Character } from '@/lib/characters';

export default function CharacterNavImage({ character, size }: { character: Character; size: number }) {
    const [useFallback, setUseFallback] = useState(false);
    const source = useFallback
        ? `/images/characters/${character.imageNumber}_default.jpg`
        : `/images/ui/nav_${character.id}.png`;

    return (
        <Image
            src={source}
            alt={character.name}
            width={size}
            height={size}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={useFallback ? undefined : () => setUseFallback(true)}
        />
    );
}
