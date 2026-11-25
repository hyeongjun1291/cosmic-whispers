'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Paper, Text, Stack, Group, ActionIcon, ScrollArea, Tooltip, Divider, RingProgress } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend, IconChevronUp, IconChevronDown, IconHeartFilled } from '@tabler/icons-react';
import { CHARACTERS, type Character } from '@/lib/characters';
import { MAX_MESSAGE_LENGTH, type ChatMessage } from '@/lib/chat-contract';
import CharacterNavImage from './CharacterNavImage';

interface VisualNovelProps {
    userName: string;
    history: ChatMessage[];
    onSendMessage: (msg: string) => Promise<boolean>;
    onSwitchToCharacter: (id: string) => void;
    isTyping: boolean;
    characterId: string;
    affectionScore: number;
    dashboard?: React.ReactNode;
}

export default function VisualNovel({
    userName,
    history,
    onSendMessage,
    isTyping,
    characterId,
    onSwitchToCharacter,
    affectionScore,
    dashboard
}: VisualNovelProps) {
    const [inputText, setInputText] = useState('');
    const lastMessage = history[history.length - 1];
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevAffectionRef = useRef(affectionScore);
    const prevCharacterIdRef = useRef(characterId);
    const [affectionDelta, setAffectionDelta] = useState<{ id: number; value: number } | null>(null);

    // Track affection changes for visual feedback
    useEffect(() => {
        // If character changed, reset baselines without showing delta
        if (characterId !== prevCharacterIdRef.current) {
            prevAffectionRef.current = affectionScore;
            prevCharacterIdRef.current = characterId;
            setAffectionDelta(null);
            return;
        }

        const delta = affectionScore - prevAffectionRef.current;
        if (delta !== 0) {
            setAffectionDelta({ id: Date.now(), value: delta });
            prevAffectionRef.current = affectionScore;

            // Clear delta after animation
            const timer = setTimeout(() => setAffectionDelta(null), 1500);
            return () => clearTimeout(timer);
        }
    }, [affectionScore, characterId]);

    // Format text with line breaks
    const formatText = (text: string) => {
        if (!text) return '';
        return text
            .replace(/(\.{3}|[.!?。!?])\s*/g, '$1\n')
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

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleSend = async () => {
        const message = inputText.trim();
        if (!isTyping && message && await onSendMessage(message)) {
            setInputText(current => current.trim() === message ? '' : current);
        }
    };

    return (
        <Box h="100vh" w="100vw" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background */}
            <Box className="oriental-pattern" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

            {/* Main Layout: Desktop - 3 Columns, Mobile - Full Screen with Overlay */}
            <Box className="main-layout">
                {/* Left Side - Dashboard (Desktop Only) */}
                <Box className="dashboard-panel desktop-only">
                    {dashboard}
                </Box>
                {/* Center - Character Image & Viewport Overlay */}
                <Box className="character-panel">
                    {/* Floating Character Nav - Positioned inside Character Panel to avoid overlap with Dashboard */}
                    <Box style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 50 }} visibleFrom="sm">
                        <Stack gap="md" align="center" style={{ backgroundColor: 'transparent', padding: '10px' }}>
                            {Object.values(CHARACTERS).map((char) => (
                                <Tooltip key={char.id} label={char.name} position="right" withArrow>
                                    <button
                                        onClick={() => onSwitchToCharacter(char.id)}
                                        className="nav-custom-btn"
                                        style={{
                                            opacity: characterId === char.id ? 1 : 0.6,
                                            filter: characterId === char.id ? 'drop-shadow(0 0 5px gold)' : 'grayscale(0.5)'
                                        }}
                                    >
                                        <CharacterNavImage character={char} size={60} />
                                    </button>
                                </Tooltip>
                            ))}
                        </Stack>
                    </Box>

                    {/* Character & Viewport Overlay */}
                    <Box className="viewport-overlay">
                        <Box className="viewport-hole">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={imagePath}
                                    src={imagePath}
                                    alt={character.name}
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1.02 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="character-portrait"
                                />
                            </AnimatePresence>

                            {/* Decorative Border for the hole */}
                            <Box className="hole-border" />
                        </Box>
                    </Box>

                    {/* Name Plate */}
                    <Box className="name-plate-overlay">
                        <Text c="white" size="lg" fw={700} ta="center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            {character.name}
                        </Text>
                        <Text c="gold" size="xs" ta="center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                            {character.title}
                        </Text>
                    </Box>

                    {/* Affection Meter - Floating Top Right of Character Panel */}
                    <Box style={{
                        position: 'absolute',
                        top: 40,
                        right: 40,
                        zIndex: 60,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid gold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <RingProgress
                            size={40}
                            thickness={4}
                            roundCaps
                            sections={[{ value: affectionScore, color: 'pink' }]}
                            label={
                                <Box style={{ display: 'flex', justifyContent: 'center' }}>
                                    <IconHeartFilled size={16} color="pink" />
                                </Box>
                            }
                        />
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" lh={1}>호감도</Text>
                            <Text size="sm" fw={700} c="pink" lh={1}>{affectionScore}%</Text>
                        </Stack>

                        {/* Floating Delta Feedback */}
                        <AnimatePresence>
                            {affectionDelta && (
                                <motion.div
                                    key={affectionDelta.id}
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{ opacity: 1, y: -20 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: -20,
                                        color: affectionDelta.value > 0 ? '#ff6b6b' : '#74c0fc',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        textShadow: '0 1px 2px black'
                                    }}
                                >
                                    {affectionDelta.value > 0 ? `+${affectionDelta.value}` : affectionDelta.value}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Box>
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
                                    maxLength={MAX_MESSAGE_LENGTH}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && void handleSend()}
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
        </Box >
    );
}

interface MobileChatOverlayProps {
    history: ChatMessage[];
    character: Character;
    userName: string;
    inputText: string;
    setInputText: (value: string) => void;
    handleSend: () => Promise<void>;
    isTyping: boolean;
    formatText: (text: string) => string;
}

function MobileChatOverlay({
    history,
    character,
    userName,
    inputText,
    setInputText,
    handleSend,
    isTyping,
    formatText
}: MobileChatOverlayProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false); // New state to hide chat completely
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
            if (diff > 0 && !isExpanded && !isMinimized) {
                setIsExpanded(true); // Swipe Up -> Expand
            } else if (diff < 0) {
                if (isExpanded) {
                    setIsExpanded(false); // Swipe Down (from expanded) -> Collapse
                } else {
                    // Swipe Down (from collapsed) -> Minimize? Maybe just button for now to be safe
                }
            }
        }
        setStartY(0);
        setCurrentY(0);
    };

    const toggleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
        if (isMinimized) {
            // Restoring
            // keep isExpanded as is?
        } else {
            // Minimizing
            setIsExpanded(false); // Collapse if expanded
        }
    };

    return (
        <Box className="mobile-chat-overlay" style={{ pointerEvents: 'none' }}> {/* Container passes clicks */}
            <motion.div
                className={`mobile-chat-container ${isExpanded ? 'expanded' : ''}`}
                initial={{ y: 0 }}
                animate={{
                    y: isMinimized ? 'calc(100% - 48px)' : (isExpanded ? 0 : 0)
                    // If minimized, push down leaving only header. If expanded/collapsed, handled by CSS height usually, or we can animate height here
                    // Actually existing CSS handles height for expanded class.
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ pointerEvents: 'auto' }}
            >
                {/* Drag Handle & Toggle */}
                <Box
                    className="drag-handle"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => !isMinimized && setIsExpanded(!isExpanded)}
                    style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                    <Box className="drag-indicator" />

                    {/* Minimize/Restore Button */}
                    <ActionIcon
                        variant="transparent"
                        color="gray"
                        size="sm"
                        style={{ position: 'absolute', right: 10 }}
                        onClick={toggleMinimize}
                    >
                        {isMinimized ? <IconChevronUp /> : <IconChevronDown />}
                    </ActionIcon>

                    {!isExpanded && !isMinimized && (
                        <Text size="xs" c="dimmed" ta="center" mt={4} style={{ display: 'none' }}>
                            {/* Hiding text to clean up UI */}
                        </Text>
                    )}
                </Box>

                {/* Chat Content - Hidden if minimized */}
                {!isMinimized && (
                    <>
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
                                    {history.map((msg, idx) => (
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
                                    maxLength={MAX_MESSAGE_LENGTH}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && void handleSend()}
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
                    </>
                )}
            </motion.div>
        </Box>
    );
}
