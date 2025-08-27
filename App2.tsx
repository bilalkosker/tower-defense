import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
    Text,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const blockSize = 60;
const playerSize = 20;
const speed = 3;

interface Block {
    x: number;
    y: number;
}

export default function App() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [playerX, setPlayerX] = useState(0);
    const [playerY, setPlayerY] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('right');
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    // Yol ve başlangıç pozisyonu
    useEffect(() => {
        const initialBlocks: Block[] = [];
        let startX = width / 2 - blockSize / 2;
        let startY = height - 100;

        for (let i = 0; i < 50; i++) {
            initialBlocks.push({ x: startX, y: startY });
            if (i % 2 === 0) startX += blockSize;
            else startX -= blockSize;
            startY -= blockSize;
        }

        setBlocks(initialBlocks);

        // Oyuncuyu ilk bloğun ortasına yerleştir
        const firstBlock = initialBlocks[0];
        setPlayerX(firstBlock.x + blockSize / 2);
        setPlayerY(firstBlock.y + blockSize / 2);
    }, []);

    // Oyuncu hareketi ve çarpışma kontrolü
    useEffect(() => {
        if (gameOver) return;

        const interval = setInterval(() => {
            setPlayerY(prevY => prevY - speed);
            setPlayerX(prevX =>
                direction === 'right' ? prevX + speed : prevX - speed
            );

            setScore(prev => prev + 1);

            // Çarpışma kontrolü
            const currentBlock = blocks.find(b => {
                const cx = b.x + blockSize / 2;
                const cy = b.y + blockSize / 2;
                return (
                    Math.abs(cx - playerX) < blockSize * 0.6 &&
                    Math.abs(cy - playerY) < blockSize * 0.6
                );
            });

            if (!currentBlock) {
                setGameOver(true);
            }
        }, 16);

        return () => clearInterval(interval);
    }, [playerX, playerY, direction, blocks, gameOver]);

    const handlePress = () => {
        if (gameOver) {
            // Restart oyunu
            const firstBlock = blocks[0];
            setPlayerX(firstBlock.x + blockSize / 2);
            setPlayerY(firstBlock.y + blockSize / 2);
            setDirection('right');
            setScore(0);
            setGameOver(false);
            return;
        }

        // Yön değiştir
        setDirection(prev => (prev === 'right' ? 'left' : 'right'));
    };

    return (
        <TouchableWithoutFeedback onPress={handlePress}>
            <View style={styles.container}>

                {/* Yol blokları */}
                {blocks.map((b, i) => (
                    <View
                        key={i}
                        style={[
                            styles.block,
                            {
                                left: b.x,
                                top: b.y,
                                backgroundColor: i % 2 === 0 ? '#444' : '#666',
                            },
                        ]}
                    />
                ))}

                {/* Oyuncu */}
                <View
                    style={[
                        styles.player,
                        {
                            left: playerX - playerSize / 2,
                            top: playerY - playerSize / 2,
                        },
                    ]}
                />

                {/* Game Over ekranı */}
                {gameOver && (
                    <View style={styles.overlay}>
                        <Text style={styles.gameOver}>Game Over</Text>
                        <Text style={styles.retry}>Tap to retry</Text>
                    </View>
                )}
                <Text style={styles.score}>Score: {score}</Text>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111' },
    block: {
        position: 'absolute',
        width: blockSize,
        height: blockSize,
        borderRadius: 10,
    },
    player: {
        position: 'absolute',
        width: playerSize,
        height: playerSize,
        backgroundColor: 'cyan',
        borderRadius: playerSize / 2,
    },
    score: {
        color: '#fff',
        fontSize: 20,
        textAlign: 'center',
        marginTop: 40,
    },
    overlay: {
        position: 'absolute',
        top: height / 2 - 80,
        width: '100%',
        alignItems: 'center',
    },
    gameOver: {
        color: 'red',
        fontSize: 36,
        fontWeight: 'bold',
    },
    retry: {
        color: '#fff',
        fontSize: 18,
        marginTop: 10,
    },
});
