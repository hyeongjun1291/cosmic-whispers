
import { useState, useRef } from 'react';
import { Box, Text, Stack, Button, UnstyledButton } from '@mantine/core'; // Removed keyframes
import { motion, AnimatePresence } from 'framer-motion';
import { drawRandomObanggi, ShamanResult } from '@/lib/shaman';


interface ObanggiSelectionProps {
    onComplete: (result: ShamanResult) => void;
    onCancel: () => void;
}

export default function ObanggiSelection({ onComplete, onCancel }: ObanggiSelectionProps) {
    const [isShaking, setIsShaking] = useState(false);
    const [result, setResult] = useState<ShamanResult | null>(null);

    const handleShake = () => {
        setIsShaking(true);
        setTimeout(() => {
            const drawn = drawRandomObanggi();
            setResult(drawn);
            setIsShaking(false);

            // Auto complete after short delay to view result? 
            // Or let user click confirm. Let's let user click confirm or auto-close.
            // Let's hold it there.
        }, 1500);
    };

    const handleConfirm = () => {
        if (result) onComplete(result);
    };

    // Placeholder Flag Visuals
    const getFlagColor = (color: string) => {
        switch (color) {
            case 'blue': return '#00498c';
            case 'red': return '#d32f2f';
            case 'white': return '#f5f5f5';
            case 'green': return '#388e3c';
            case 'yellow': return '#fbc02d';
            default: return '#333';
        }
    };

    return (
        <Stack align="center" justify="center" h="100%" gap="xl">
            {!result ? (
                <>
                    <Text size="xl" fw={700} c="white" ta="center">
                        오방기 뽑기
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                        마음을 차분히 하고<br />오방기를 흔들어 오늘의 기운을 확인하세요.
                    </Text>

                    <UnstyledButton onClick={handleShake} disabled={isShaking}>
                        <motion.div
                            animate={isShaking ? { rotate: [0, -10, 10, -10, 10, 0], transition: { duration: 0.5, repeat: 3 } } : {}}
                            style={{
                                width: 200,
                                height: 300,
                                background: 'linear-gradient(135deg, #FFD700, #DAA520)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
                                position: 'relative'
                            }}
                        >
                            <img
                                src="/images/ui/obanggi_container.png" // Placeholder or Emoji
                                style={{ width: '80%', opacity: 0.8 }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            {!isShaking && (
                                <Text size="4rem" style={{ position: 'absolute' }}>🏳️‍🌈</Text>
                            )}
                        </motion.div>
                    </UnstyledButton>

                    <Text size="xs" c="dimmed">
                        {isShaking ? '신령님의 기운을 받는 중...' : '깃발 통을 터치하세요'}
                    </Text>
                </>
            ) : (
                <Stack align="center" gap="lg" style={{ animation: 'fadeIn 0.5s ease' }}>
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        style={{
                            width: 200,
                            height: 300,
                            backgroundColor: getFlagColor(result.flagColor),
                            borderRadius: '8px',
                            boxShadow: `0 0 30px ${getFlagColor(result.flagColor)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            border: '4px solid gold'
                        }}
                    >
                        <Text size="3rem" fw={900} c={result.flagColor === 'white' ? 'black' : 'white'} style={{ writingMode: 'vertical-rl', textOrientation: 'upright', letterSpacing: '0.5rem' }}>
                            {result.flagName.split(' ')[0]}
                        </Text>
                    </motion.div>

                    <Stack gap={0} align="center">
                        <Text size="xl" fw={700} c="gold">{result.flagName}</Text>
                        <Text size="sm" c="dimmed">{result.direction}</Text>
                    </Stack>

                    <Text size="md" ta="center" maw={300} style={{ whiteSpace: 'pre-wrap' }}>
                        {result.meaning}
                    </Text>

                    <Button
                        color="yellow"
                        size="lg"
                        fullWidth
                        onClick={handleConfirm}
                        variant="gradient"
                        gradient={{ from: 'orange', to: 'red' }}
                    >
                        이 점괘로 상담하기
                    </Button>
                </Stack>
            )}
        </Stack>
    );
}
