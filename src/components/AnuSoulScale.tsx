import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Box, Text, Stack, Button, Textarea, Group, Transition } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { SoulWeight, weighWorry } from '@/lib/egypt';
import { IconScale, IconMessageCircle, IconRefresh } from '@tabler/icons-react';

export interface AnuSoulScaleRef {
    autoWeigh: (text: string) => void;
}

interface AnuSoulScaleProps {
    userName: string;
    onReference: (result: SoulWeight) => void;
}

const AnuSoulScale = forwardRef<AnuSoulScaleRef, AnuSoulScaleProps>(({ userName, onReference }, ref) => {
    const [step, setStep] = useState<'input' | 'condensing' | 'weighing' | 'result'>('input');
    const [worryText, setWorryText] = useState('');
    const [result, setResult] = useState<SoulWeight | null>(null);

    // Animation Refs
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose method to parent
    useImperativeHandle(ref, () => ({
        autoWeigh: (text: string) => {
            setWorryText(text);
            startCondenseProcess(text);
        }
    }));

    const startCondenseProcess = (text: string) => {
        setStep('condensing');
        // Simulate calculation & condense effect
        setTimeout(() => {
            const weight = weighWorry(userName, text);
            setResult(weight);
            setStep('weighing');
        }, 2000);
    };

    const handleCondense = () => {
        if (!worryText.trim()) return;
        startCondenseProcess(worryText);
    };

    const handleWeighingComplete = () => {
        setTimeout(() => {
            setStep('result');
            if (result) onReference(result);
        }, 2500); // Wait for scale to settle
    };

    useEffect(() => {
        if (step === 'weighing') {
            handleWeighingComplete();
        }
    }, [step]);

    // Scale Rotation Calculation
    // 20mg = 0 deg (Balanced)
    // < 20mg = -15 deg (Light, Scale goes UP on right side? Wait.. feather is on one side.)
    // Let's say Feather is on LEFT. Heart on RIGHT.
    // Standard Ma'at: Heart (Right) vs Feather (Left).
    // If Heart is Heavy -> Right side goes DOWN (Positive Rotation).

    // Let's assume Balanced (20-50mg) is roughly equal.
    // Feather is magically variable or standard? Ma'at feather is the standard.
    // Let's map mg to rotation.
    // 0-20mg (Light) -> Right side UP (Negative Rotation)
    // 30-50mg (Balanced) -> roughly 0
    // >50mg (Heavy) -> Right side DOWN (Positive Rotation)

    const getScaleRotation = (mg: number) => {
        if (mg < 20) return -15; // Light
        if (mg > 50) return 20;  // Heavy
        // Map 20-50 to -5 ~ 5
        return ((mg - 35) / 15) * 5;
    };

    return (
        <Stack align="center" justify="center" h="100%" gap="lg" style={{ position: 'relative', overflow: 'hidden' }}>

            {/* Background Decor */}
            <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.2, pointerEvents: 'none' }}>
                <div className="stars" />
            </Box>

            <AnimatePresence mode="wait">

                {/* STEP 1: INPUT */}
                {step === 'input' && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{ width: '100%', maxWidth: 400, zIndex: 1 }}
                    >
                        <Stack>
                            <Text size="xl" fw={700} c="gold" ta="center">심장의 무게 달기</Text>
                            <Text size="sm" c="dimmed" ta="center" mb="md">
                                당신의 고민을 이곳에 털어놓으세요.<br />
                                아누의 저울이 그 무게를 판단할 것입니다.
                            </Text>

                            <Textarea
                                placeholder="요즘 마음을 짓누르는 것은 무엇인가요?"
                                minRows={4}
                                value={worryText}
                                onChange={(e) => setWorryText(e.target.value)}
                                styles={{ input: { background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #444' } }}
                            />

                            <Button
                                fullWidth
                                color="yellow"
                                size="md"
                                onClick={handleCondense}
                                disabled={!worryText.trim()}
                                leftSection={<IconScale size={18} />}
                            >
                                무게 측정하기
                            </Button>
                        </Stack>
                    </motion.div>
                )}

                {/* STEP 2: CONDENSING ANIMATION */}
                {step === 'condensing' && (
                    <motion.div
                        key="condensing"
                        style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
                    >
                        {/* Floating Letters congregating */}
                        <Box style={{ position: 'relative', width: 200, height: 200 }}>
                            {[...Array(10)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 300, opacity: 1 }}
                                    animate={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        color: 'white',
                                        fontSize: '12px'
                                    }}
                                >
                                    {worryText.slice(i, i + 1) || "?"}
                                </motion.div>
                            ))}

                            {/* Forming the Heart Bead (Ib) */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1.2, duration: 0.5, type: 'spring' }}
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle at 30% 30%, #ff4d4d, #8b0000)',
                                    boxShadow: '0 0 20px #ff0000',
                                    position: 'absolute',
                                    top: 'calc(50% - 30px)',
                                    left: 'calc(50% - 30px)',
                                    zIndex: 10
                                }}
                            />
                        </Box>
                    </motion.div>
                )}

                {/* STEP 3 & 4: WEIGHING & RESULT */}
                {(step === 'weighing' || step === 'result') && result && (
                    <motion.div
                        key="weighing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ width: '100%', maxWidth: 400, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        {/* THE SCALE VISUAL */}
                        <Box style={{ width: 300, height: 200, position: 'relative', marginBottom: 20 }}>
                            {/* Stand */}
                            <Box style={{ position: 'absolute', bottom: 0, left: '50%', width: 4, height: 150, background: 'gold', transform: 'translateX(-50%)' }} />
                            <Box style={{ position: 'absolute', bottom: 0, left: '50%', width: 100, height: 4, background: 'gold', transform: 'translateX(-50%)' }} />

                            {/* Beam */}
                            <motion.div
                                animate={{ rotate: getScaleRotation(result.mg) }}
                                transition={{ type: "spring", stiffness: 60, damping: 10 }}
                                style={{
                                    position: 'absolute',
                                    top: 50,
                                    left: '10%',
                                    width: '80%',
                                    height: 6,
                                    background: 'gold',
                                    borderRadius: 3,
                                    transformOrigin: '50% 50%'
                                }}
                            >
                                {/* Left Plate (Feather) */}
                                <Box style={{ position: 'absolute', left: 0, top: 0 }}>
                                    <Box style={{ width: 2, height: 80, background: 'rgba(255,215,0,0.5)', position: 'absolute', top: 3, left: 10 }} />
                                    <Box style={{
                                        width: 60,
                                        height: 10,
                                        borderBottom: '2px solid gold',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        top: 83,
                                        left: -20,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <Text size="3rem">🪶</Text>
                                    </Box>
                                </Box>

                                {/* Right Plate (Heart) */}
                                <Box style={{ position: 'absolute', right: 0, top: 0 }}>
                                    <Box style={{ width: 2, height: 80, background: 'rgba(255,215,0,0.5)', position: 'absolute', top: 3, right: 10 }} />
                                    <Box style={{
                                        width: 60,
                                        height: 10,
                                        borderBottom: '2px solid gold',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        top: 83,
                                        right: -20,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        {/* The Heart drops in! */}
                                        <motion.div
                                            initial={{ y: -200, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                                            style={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: '50%',
                                                background: 'radial-gradient(circle at 30% 30%, #ff4d4d, #8b0000)',
                                                boxShadow: '0 0 10px #ff0000',
                                                position: 'absolute',
                                                bottom: 5
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </motion.div>
                        </Box>

                        {/* RESULT DISPLAY */}
                        {step === 'result' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ textAlign: 'center', width: '100%' }}
                            >
                                <Text size="3rem" fw={900} c={result.level === 'light' ? 'cyan' : result.level === 'heavy' ? 'red' : 'gold'} style={{ lineHeight: 1 }}>
                                    {result.mg}<span style={{ fontSize: '1.5rem' }}>mg</span>
                                </Text>
                                <Text size="sm" c="dimmed" mb="md">{result.verdict}</Text>

                                <Box p="xs" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 16 }}>
                                    <Text size="xs" c="dimmed">⚖️ {result.calcDetail}</Text>
                                </Box>

                                <Group grow>
                                    <Button variant="outline" color="gray" onClick={() => {
                                        setStep('input');
                                        setWorryText('');
                                        setResult(null);
                                    }}>
                                        다시하기
                                    </Button>
                                    {/* Already triggered onReference in parent, essentially this just confirms visuals */}
                                </Group>
                            </motion.div>
                        )}
                    </motion.div>
                )}

            </AnimatePresence>
        </Stack>
    );
});

export default AnuSoulScale;
