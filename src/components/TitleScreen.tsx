'use client';

import { Stack, Title, Text, Button } from '@mantine/core';
import { motion } from 'framer-motion';

interface TitleScreenProps {
    onEnter: () => void;
}

export default function TitleScreen({ onEnter }: TitleScreenProps) {
    return (
        <Stack align="center" justify="center" h="100vh" gap="xl" px={{ base: 'md', sm: 0 }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <Title
                    order={1}
                    size="3.5rem"
                    c="gold"
                    className="title-glow main-title"
                    style={{ fontFamily: "'Noto Serif KR', serif", letterSpacing: '0.2em', textAlign: 'center' }}
                >
                    별의 속삭임
                </Title>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
            >
                <Text c="gray.3" size="lg" className="subtitle-text" style={{ letterSpacing: '0.1em', textAlign: 'center' }}>
                    운명을 읽는 그들의 목소리
                </Text>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
            >
                <Button
                    variant="outline"
                    color="gold"
                    size="lg"
                    radius="xl"
                    onClick={onEnter}
                    className="title-button"
                    mt={40}
                    style={{
                        borderColor: 'rgba(255, 215, 0, 0.5)',
                        color: '#ffd700',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderWidth: '1px',
                        padding: '0 40px'
                    }}
                >
                    입장하기
                </Button>
            </motion.div>
        </Stack>
    );
}
