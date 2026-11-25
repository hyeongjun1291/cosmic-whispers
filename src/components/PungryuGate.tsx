import { useState } from 'react';
import { Box, Text, Button, Modal, Stack, Overlay } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';

interface PungryuGateProps {
    onEnter: () => void;
    onCancel: () => void;
}

export default function PungryuGate({ onEnter, onCancel }: PungryuGateProps) {
    // Stage: 'initial' (closed door), 'confirming' (popup), 'opening' (transition), 'open'
    const [stage, setStage] = useState<'initial' | 'opening' | 'open'>('initial');
    const [confirmOpen, setConfirmOpen] = useState(true); // Start with confirmation popup immediately

    const handleConfirm = () => {
        setConfirmOpen(false);
        setStage('opening');

        // Simulate opening delay
        setTimeout(() => {
            setStage('open');
            // Enter chat after door is fully open
            setTimeout(onEnter, 2000);
        }, 1500);
    };

    return (
        <Box
            w="100%"
            h="100vh"
            style={{
                position: 'relative',
                overflow: 'hidden',
                background: '#000',
            }}
        >
            <AnimatePresence mode="wait">
                {stage === 'initial' || stage === 'opening' ? (
                    <motion.div
                        key="closed-door"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{
                            opacity: 1,
                            x: stage === 'opening' ? [0, -5, 5, -5, 5, 0] : 0, // Shake effect
                            scale: stage === 'opening' ? 1.15 : 1.1
                        }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative'
                        }}
                    >
                        <motion.img
                            src="/photo/door/closed.png?v=2"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                maxWidth: '100vw',
                                maxHeight: '100vh'
                            }}
                        />
                        <Overlay color="#000" backgroundOpacity={stage === 'opening' ? 0.2 : 0.6} zIndex={1} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="open-door"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <motion.img
                            src="/photo/door/open.png?v=2"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                maxWidth: '100vw',
                                maxHeight: '100vh'
                            }}
                        />
                        <Overlay color="#000" backgroundOpacity={0.0} zIndex={1} />
                    </motion.div>
                )}
            </AnimatePresence>

            <Modal
                opened={confirmOpen}
                onClose={onCancel}
                centered
                withCloseButton={false}
                overlayProps={{ backgroundOpacity: 0.8, blur: 5 }}
                styles={{
                    content: { backgroundColor: '#1a1b1e', border: '1px solid #333' }
                }}
            >
                <Stack align="center" gap="xl" py="lg">
                    <Text c="red.9" size="xl" fw={700} style={{ fontFamily: 'serif' }}>
                        경고
                    </Text>
                    <Text c="gray.3" ta="center">
                        이 문 너머에는 산 자와 죽은 자의 경계가 희미합니다.<br />
                        무당의 집에 들어갈 각오가 되셨습니까?
                    </Text>
                    <Button
                        color="red"
                        variant="light"
                        fullWidth
                        onClick={handleConfirm}
                        className="pulse-effect"
                    >
                        문 열기
                    </Button>
                    <Button variant="subtle" color="gray" size="xs" onClick={onCancel}>
                        돌아가기
                    </Button>
                </Stack>
            </Modal>
        </Box>
    );
}
