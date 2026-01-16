import { useState } from 'react';
import { Box, Text, Stack, Button, UnstyledButton, Group } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { drawRandomObanggi, ShamanResult } from '@/lib/shaman';

interface HwariCheeringKitProps {
    userName: string;
    existingResult?: ShamanResult | null;
    onCheer: (result: ShamanResult) => void;
}

export default function HwariCheeringKit({ userName, existingResult, onCheer }: HwariCheeringKitProps) {
    const [isShaking, setIsShaking] = useState(false);
    const [lastResult, setLastResult] = useState<ShamanResult | null>(existingResult || null);

    const handleShake = () => {
        if (isShaking || lastResult) return; // Prevent if already has result
        setIsShaking(true);
        setLastResult(null);

        // Shake animation time
        setTimeout(() => {
            const drawn = drawRandomObanggi();
            setLastResult(drawn);
            setIsShaking(false);
            onCheer(drawn);
        }, 1500);
    };

    const getFlagColor = (color: string) => {
        switch (color) {
            case 'blue': return '#00498c';
            case 'red': return '#d32f2f';
            case 'white': return '#f8f9fa';
            case 'green': return '#388e3c';
            case 'yellow': return '#fbc02d';
            default: return '#333';
        }
    };

    return (
        <Stack align="center" gap="md" w="100%">
            <Box
                p="md"
                style={{
                    background: 'rgba(255, 107, 107, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                    width: '100%'
                }}
            >
                <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={700} c="#ff6b6b">🎵 화리의 응원 키트</Text>
                    <Text size="xs" c="dimmed">오방기 (Lightstick ver.)</Text>
                </Group>

                <Stack align="center" gap="lg" py="md">
                    <AnimatePresence mode='wait'>
                        {!lastResult ? (
                            <motion.div
                                key="stick"
                                animate={isShaking ? {
                                    rotate: [0, -15, 15, -15, 15, 0],
                                    scale: [1, 1.1, 1, 1.1, 1],
                                    filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                                } : {
                                    y: [0, -5, 0],
                                    transition: { repeat: Infinity, duration: 2 }
                                }}
                                transition={{ duration: 0.5 }}
                            >
                                <UnstyledButton onClick={handleShake} disabled={isShaking || !!lastResult} style={{ fontSize: '4rem', cursor: !!lastResult ? 'default' : 'pointer', opacity: !!lastResult ? 0.5 : 1 }}>
                                    🪄
                                </UnstyledButton>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ scale: 0, rotateY: 180 }}
                                animate={{ scale: 1, rotateY: 0 }}
                                transition={{ type: 'spring', damping: 12 }}
                                style={{
                                    width: 80,
                                    height: 120,
                                    backgroundColor: getFlagColor(lastResult.flagColor),
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 15px rgba(255,255,255,0.3)',
                                    border: '2px solid white'
                                }}
                            >
                                <Text size="2rem" fw={900} c={lastResult.flagColor === 'white' ? 'black' : 'white'} style={{ writingMode: 'vertical-rl' }}>
                                    {lastResult.flagName.split(' ')[0]}
                                </Text>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Box ta="center">
                        {isShaking ? (
                            <Text size="sm" c="#ff6b6b" className="pulse">
                                신령님의 비트를 타는 중... 🥁
                            </Text>
                        ) : lastResult ? (
                            <Stack gap={2}>
                                <Text size="lg" fw={700} c="white">{lastResult.flagName}!</Text>
                                <Text size="xs" c="dimmed">{lastResult.meaning}</Text>
                                {/* REMOVED RE-ROLL BUTTON FOR CREDIBILITY */}
                                <Text size="xs" c="orange" mt="xs">오늘의 점괘 확정 ✨</Text>
                            </Stack>
                        ) : (
                            <Text size="sm" c="dimmed">
                                응원봉을 눌러서<br />오늘의 '센터' 운세를 뽑아봐!
                            </Text>
                        )}
                    </Box>
                </Stack>
            </Box>
        </Stack>
    );
}
