'use client';

import { useEffect } from 'react';
import { Stack, Title, Text, Button } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';

interface TitleScreenProps {
    onEnter: () => void;
}

export default function TitleScreen({ onEnter }: TitleScreenProps) {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                onEnter();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onEnter]);

    return (
        <Stack align="center" justify="center" h="100vh" gap="xl" px={{ base: 'md', sm: 0 }}>
            <Title
                order={1}
                size="3.5rem"
                c="gold"
                className="title-glow main-title"
                style={{ fontFamily: "'Noto Serif KR', serif", letterSpacing: '0.2em', textAlign: 'center' }}
            >
                별의 속삭임
            </Title>
            <Text c="gray.3" size="lg" className="subtitle-text" style={{ letterSpacing: '0.1em', textAlign: 'center' }}>
                당신의 하루를 밝혀주는 작은 친구들
            </Text>

            <Button
                variant="outline"
                color="gold"
                size="lg"
                radius="xl"
                onClick={onEnter}
                className="title-button"
                mt={40}
                leftSection={<IconPlayerPlay size={20} />}
                styles={{
                    root: {
                        borderColor: 'rgba(255, 215, 0, 0.5)',
                        color: '#ffd700',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderWidth: '1px',
                        padding: '0 40px'
                    },
                    section: { marginRight: 12 }
                }}
            >
                별의 속삭임 입장하기
            </Button>
        </Stack>
    );
}
