import { useState, useEffect, useRef } from 'react';
import { Box, Text, SimpleGrid, Center } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import type { TarotCard } from '@/lib/tarotData';

interface TarotCardSelectionProps {
    deck: TarotCard[];
    onSelect: (card: TarotCard) => void;
}

export default function TarotCardSelection({ deck, onSelect }: TarotCardSelectionProps) {
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => () => {
        timers.current.forEach(clearTimeout);
    }, []);

    const handleCardClick = (card: TarotCard) => {
        if (selectedCardId) return; // Prevent multiple clicks
        setSelectedCardId(card.id);

        // Start flip sequence
        timers.current = [
            setTimeout(() => setIsFlipped(true), 600),
            setTimeout(() => onSelect(card), 3000),
        ];
    };

    return (
        <Box
            w="100%"
            h="100vh"
            style={{
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.95)',
                perspective: '1000px'
            }}
        >
            <AnimatePresence>
                {!selectedCardId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Text c="white" size="lg" fw={300} ta="center" pt="xl" mb="xl" style={{ textShadow: '0 0 10px gold' }}>
                            운명을 선택하세요. (78장 중 택1)
                        </Text>
                        <Center>
                            <SimpleGrid cols={{ base: 6, sm: 10, md: 13 }} spacing="xs" p="md" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                                {deck.map((card) => (
                                    <motion.div
                                        key={card.id}
                                        layoutId={card.id}
                                        whileHover={{
                                            scale: 1.1,
                                            y: -5,
                                            boxShadow: '0 0 15px gold',
                                            border: '1px solid gold'
                                        }}
                                        onClick={() => handleCardClick(card)}
                                        style={{
                                            width: 40,
                                            height: 60,
                                            backgroundImage: 'url(/photo/card/back.avif)',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}
                                    />
                                ))}
                            </SimpleGrid>
                        </Center>
                    </motion.div>
                )}
            </AnimatePresence>

            {selectedCardId && (
                <Center style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    {deck.filter(c => c.id === selectedCardId).map(card => (
                        <motion.div
                            key={card.id}
                            layoutId={card.id}
                            style={{
                                width: 300,
                                height: 500,
                                position: 'relative',
                                transformStyle: 'preserve-3d',
                            }}
                            animate={{
                                rotateY: isFlipped ? 180 : 0,
                                scale: 1.2
                            }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                            {/* Front (Back of Card) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backfaceVisibility: 'hidden',
                                    backgroundImage: 'url(/photo/card/back.avif)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: '16px',
                                    boxShadow: '0 0 50px rgba(255,215,0,0.5)',
                                    border: '2px solid gold'
                                }}
                            />

                            {/* Back (Face of Card) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    backgroundImage: `url('${card.image}')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: '16px',
                                    boxShadow: '0 0 50px rgba(255,215,0,0.8)',
                                    border: '2px solid gold',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center'
                                }}
                            >
                                <Box bg="rgba(0,0,0,0.7)" w="100%" p="md" style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                                    <Text c="white" fw={700} ta="center" size="lg">{card.name}</Text>
                                    <Text c="dimmed" size="xs" ta="center">잠시 후 운명 해석이 시작됩니다...</Text>
                                </Box>
                            </div>
                        </motion.div>
                    ))}
                </Center>
            )}
        </Box>
    );
}
