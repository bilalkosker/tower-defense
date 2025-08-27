import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Pressable,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const TARGET_SIZE = 60;
const GAME_DURATION = 30; // saniye

export default function App() {
    const [targetX, setTargetX] = useState(100);
    const [targetY, setTargetY] = useState(100);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [gameActive, setGameActive] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        clearInterval(timer);
                        setGameActive(false);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [gameActive, timeLeft]);

    // Rastgele hedef pozisyonu
    const moveTarget = () => {
        const maxX = width - TARGET_SIZE;
        const maxY = height - TARGET_SIZE - 100; // üstten boşluk bıraktık

        const newX = Math.random() * maxX;
        const newY = Math.random() * maxY;

        setTargetX(newX);
        setTargetY(newY);
    };

    // Hedefe dokunulduğunda çağrılır
    const onTargetPress = () => {
        if (!gameActive) return;
        setScore(prev => prev + 1);
        moveTarget();
    };

    const startGame = () => {
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setGameActive(true);
        moveTarget();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎯 Tap The Target</Text>
            <Text style={styles.info}>Time: {timeLeft}s</Text>
            <Text style={styles.info}>Score: {score}</Text>

            {gameActive ? (
                <Pressable
                    onPress={onTargetPress}
                    style={[
                        styles.target,
                        { left: targetX, top: targetY },
                    ]}
                    android_ripple={{ color: 'white' }}
                />
            ) : (
                <View style={styles.center}>
                    <Text style={styles.gameOver}>
                        {timeLeft === 0 ? "Time's up!" : 'Ready?'}
                    </Text>
                    <Pressable onPress={startGame} style={styles.startBtn}>
                        <Text style={styles.startBtnText}>Start Game</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1a2e', paddingTop: 60 },
    title: { fontSize: 28, textAlign: 'center', color: '#fff', marginBottom: 20 },
    info: { fontSize: 18, textAlign: 'center', color: '#ccc', marginBottom: 10 },
    target: {
        position: 'absolute',
        width: TARGET_SIZE,
        height: TARGET_SIZE,
        borderRadius: TARGET_SIZE / 2,
        backgroundColor: 'tomato',
        borderWidth: 3,
        borderColor: '#fff',
    },
    center: {
        position: 'absolute',
        top: height / 2 - 100,
        width: '100%',
        alignItems: 'center',
    },
    gameOver: {
        fontSize: 32,
        color: '#fff',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    startBtn: {
        backgroundColor: '#00f7ff',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    startBtnText: {
        fontSize: 20,
        color: '#000',
        fontWeight: 'bold',
    },
});
