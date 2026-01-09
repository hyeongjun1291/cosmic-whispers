'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Paper, Text, Stack, Group, ActionIcon, ScrollArea, Tooltip, Divider } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSettings, IconSend, IconUsers } from '@tabler/icons-react';
import { CHARACTERS } from '@/lib/characters';

interface Message {
    role: 'user' | 'model';
    text: string;
    emotion?: string;
}

interface VisualNovelProps {
    userName: string;
    history: Message[];
    onSendMessage: (msg: string) => void;
    onOpenSettings: () => void;
    isTyping: boolean;
    characterId: string;
    onChangeCharacter: () => void;
}

export default function VisualNovel({
    userName,
    history,
    onSendMessage,
    onOpenSettings,
    isTyping,
    characterId,
    onChangeCharacter
}: VisualNovelProps) {
    const [inputText, setInputText] = useState('');
    const lastMessage = history[history.length - 1];
    const scrollRef = useRef<HTMLDivElement>(null);
    const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

    // Format text with line breaks
    const formatText = (text: string) => {
        return text
            .replace(/([.!?。!?])\s*/g, '$1\n')
            .replace(/\n{3,}/g, '\n\n');
    };

    const character = CHARACTERS[characterId] || CHARACTERS['cheongsan'];

    // Determine Logic for Image
    let currentEmotion = 'default';
    if (isTyping) {
        currentEmotion = 'magic';
    } else if (lastMessage?.role === 'model' && lastMessage.emotion) {
        currentEmotion = lastMessage.emotion;
    }

    // Handle extension quirk for Zion (4_magic.png)
    let extension = 'jpg';
    if (character.imageNumber === 4 && currentEmotion === 'magic') {
        extension = 'png';
    }

    const imagePath = `/images/characters/${character.imageNumber}_${currentEmotion}.${extension}`;

    // Handle image load to get aspect ratio
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const ratio = img.naturalWidth / img.naturalHeight;
        setImageAspectRatio(ratio);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleSend = () => {
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    return (
        <Box h="100vh" w="100vw" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background */}
            <Box className="oriental-pattern" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

            {/* Top Controls */}
            <Group className="top-controls" gap="xs">
                <Tooltip label="상대 변경">
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={onChangeCharacter}
                        size="lg"
                    >
                        <IconUsers size={24} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label="설정">
                    <ActionIcon
                        variant="subtle"
                        color="gold"
                        onClick={onOpenSettings}
                        size="lg"
                    >
                        <IconSettings size={24} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            {/* Main Layout: Desktop - Split, Mobile - Full Screen with Overlay */}
            <Box className="main-layout">
                {/* Left Side - Character Image with Frame (Desktop) / Full Screen (Mobile) */}
                <Box className="character-panel">
                    <motion.div
                        key={characterId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="character-frame"
                    >
                        {/* Ornamental Frame (Desktop Only) */}
                        <Box className="frame-border">
                            <Box
                                className="frame-inner"
                                style={{
                                    aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : 'auto'
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={imagePath}
                                        src={imagePath}
                                        alt={character.name}
                                        initial={{ opacity: 0.8, scale: 1.02 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0.8 }}
                                        transition={{ duration: 0.3 }}
                                        className="character-portrait"
                                        onLoad={handleImageLoad}
                                    />
                                </AnimatePresence>
                            </Box>
                        </Box>

                        {/* Character Name Plate (Desktop Only) */}
                        <Box className="name-plate" style={{ borderColor: character.color }}>
                            <Text c="white" size="lg" fw={700} ta="center">
                                {character.name}
                            </Text>
                            <Text c="gray.4" size="xs" ta="center">
                                {character.title}
                            </Text>
                        </Box>
                    </motion.div>
                </Box>

                {/* Right Side - Chat Log (Desktop) */}
                <Box className="chat-panel desktop-only">
                    <Paper className="chat-container" style={{ borderColor: `${character.color}80` }}>
                        {/* Chat Header */}
                        <Box className="chat-header" style={{ borderBottomColor: character.color }}>
                            <Text size="xl" fw={700} c={character.color}>
                                대화 기록
                            </Text>
                            <Text size="xs" c="dimmed">
                                {history.length}개의 메시지
                            </Text>
                        </Box>

                        {/* Chat Messages */}
                        <ScrollArea className="chat-messages" viewportRef={scrollRef}>
                            <Stack gap="md" p="md">
                                {history.map((msg, idx) => (
                                    <Box
                                        key={idx}
                                        className={msg.role === 'user' ? 'message-user' : 'message-model'}
                                    >
                                        <Text size="xs" c="dimmed" mb={4}>
                                            {msg.role === 'model' ? character.name : userName}
                                        </Text>
                                        <Paper
                                            p="md"
                                            className={msg.role === 'user' ? 'message-bubble-user' : 'message-bubble-model'}
                                            style={{
                                                backgroundColor: msg.role === 'user'
                                                    ? 'rgba(99, 102, 241, 0.2)'
                                                    : `rgba(${parseInt(character.color.slice(1, 3), 16)}, ${parseInt(character.color.slice(3, 5), 16)}, ${parseInt(character.color.slice(5, 7), 16)}, 0.15)`,
                                                borderLeft: `3px solid ${msg.role === 'user' ? '#6366f1' : character.color}`
                                            }}
                                        >
                                            <Text
                                                size="sm"
                                                style={{
                                                    whiteSpace: 'pre-line',
                                                    lineHeight: 1.8
                                                }}
                                            >
                                                {formatText(msg.text)}
                                                {isTyping && idx === history.length - 1 && msg.role === 'model' && (
                                                    <span className="fade-in">...</span>
                                                )}
                                            </Text>
                                        </Paper>
                                    </Box>
                                ))}
                            </Stack>
                        </ScrollArea>

                        {/* Input Area */}
                        <Box className="chat-input-area">
                            <Divider mb="md" color={character.color} opacity={0.3} />
                            <Group gap="xs">
                                <input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={`${character.name}에게 말을 걸어보세요...`}
                                    className="chat-input"
                                    style={{
                                        borderBottomColor: `${character.color}80`
                                    }}
                                    disabled={isTyping}
                                />
                                <ActionIcon
                                    variant="filled"
                                    color={character.color}
                                    onClick={handleSend}
                                    disabled={isTyping || !inputText.trim()}
                                    size="lg"
                                >
                                    <IconSend size={18} />
                                </ActionIcon>
                            </Group>
                        </Box>
                    </Paper>
                </Box>

                {/* Mobile Overlay Chat */}
                <MobileChatOverlay
                    history={history}
                    character={character}
                    userName={userName}
                    inputText={inputText}
                    setInputText={setInputText}
                    handleSend={handleSend}
                    isTyping={isTyping}
                    formatText={formatText}
                />
            </Box>
        </Box>
    );
}

// Mobile Chat Overlay Component
function MobileChatOverlay({
    history,
    character,
    userName,
    inputText,
    setInputText,
    handleSend,
    isTyping,
    formatText
}: any) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const lastMessage = history[history.length - 1];

    useEffect(() => {
        if (scrollRef.current && isExpanded) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isExpanded]);

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setCurrentY(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        const diff = startY - currentY;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && !isExpanded) {
                setIsExpanded(true);
            } else if (diff < 0 && isExpanded) {
                setIsExpanded(false);
            }
        }
        setStartY(0);
        setCurrentY(0);
    };

    return (
        <Box className="mobile-chat-overlay">
            <motion.div
                className={`mobile-chat-container ${isExpanded ? 'expanded' : ''}`}
                initial={{ y: 0 }}
                animate={{ y: isExpanded ? 0 : 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
                {/* Drag Handle */}
                <Box
                    className="drag-handle"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Box className="drag-indicator" />
                    {!isExpanded && (
                        <Text size="xs" c="dimmed" ta="center" mt={4}>
                            위로 스와이프하여 전체 대화 보기
                        </Text>
                    )}
                </Box>

                {/* Chat Content */}
                {isExpanded ? (
                    // Full Chat History
                    <ScrollArea className="mobile-full-chat" viewportRef={scrollRef}>
                        <Stack gap="md" p="md">
                            <Group justify="space-between" mb="sm">
                                <Text size="lg" fw={700} c={character.color}>
                                    대화 기록
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {history.length}개
                                </Text>
                            </Group>
                            {history.map((msg: any, idx: number) => (
                                <Box
                                    key={idx}
                                    className={msg.role === 'user' ? 'message-user' : 'message-model'}
                                >
                                    <Text size="xs" c="dimmed" mb={4}>
                                        {msg.role === 'model' ? character.name : userName}
                                    </Text>
                                    <Paper
                                        p="sm"
                                        className={msg.role === 'user' ? 'message-bubble-user' : 'message-bubble-model'}
                                        style={{
                                            backgroundColor: msg.role === 'user'
                                                ? 'rgba(99, 102, 241, 0.3)'
                                                : `rgba(${parseInt(character.color.slice(1, 3), 16)}, ${parseInt(character.color.slice(3, 5), 16)}, ${parseInt(character.color.slice(5, 7), 16)}, 0.25)`,
                                            borderLeft: `3px solid ${msg.role === 'user' ? '#6366f1' : character.color}`
                                        }}
                                    >
                                        <Text
                                            size="sm"
                                            style={{
                                                whiteSpace: 'pre-line',
                                                lineHeight: 1.7
                                            }}
                                        >
                                            {formatText(msg.text)}
                                        </Text>
                                    </Paper>
                                </Box>
                            ))}
                        </Stack>
                    </ScrollArea>
                ) : (
                    // Latest Message Only
                    <Box className="mobile-latest-message" p="md">
                        {lastMessage && (
                            <Box className={lastMessage.role === 'user' ? 'message-user' : 'message-model'}>
                                <Text size="xs" c="dimmed" mb={4}>
                                    {lastMessage.role === 'model' ? character.name : userName}
                                </Text>
                                <Paper
                                    p="sm"
                                    className={lastMessage.role === 'user' ? 'message-bubble-user' : 'message-bubble-model'}
                                    style={{
                                        backgroundColor: lastMessage.role === 'user'
                                            ? 'rgba(99, 102, 241, 0.3)'
                                            : `rgba(${parseInt(character.color.slice(1, 3), 16)}, ${parseInt(character.color.slice(3, 5), 16)}, ${parseInt(character.color.slice(5, 7), 16)}, 0.25)`,
                                        borderLeft: `3px solid ${lastMessage.role === 'user' ? '#6366f1' : character.color}`
                                    }}
                                >
                                    <Text
                                        size="sm"
                                        style={{
                                            whiteSpace: 'pre-line',
                                            lineHeight: 1.7
                                        }}
                                    >
                                        {formatText(lastMessage.text)}
                                        {isTyping && <span className="fade-in">...</span>}
                                    </Text>
                                </Paper>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Input Area */}
                <Box className="mobile-input-area" style={{ borderTopColor: `${character.color}40` }}>
                    <Group gap="xs">
                        <input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={`${character.name}에게 말을 걸어보세요...`}
                            className="chat-input"
                            style={{
                                borderBottomColor: `${character.color}80`
                            }}
                            disabled={isTyping}
                        />
                        <ActionIcon
                            variant="filled"
                            color={character.color}
                            onClick={handleSend}
                            disabled={isTyping || !inputText.trim()}
                            size="lg"
                        >
                            <IconSend size={18} />
                        </ActionIcon>
                    </Group>
                </Box>
            </motion.div>
        </Box>
    );
}
