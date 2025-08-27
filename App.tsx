import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableWithoutFeedback, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

type EnemyType = 'fast' | 'medium' | 'slow';

interface Enemy {
    id: number;
    currentIndex: number;
    progress: number;
    hp: number;
    maxHp: number;
    type: EnemyType;
}

interface Bullet {
    x: number;
    y: number;
    targetId: number;
    color: string;
}

const waypoints = [
    { x: 50, y: height - 100 },
    { x: 150, y: height - 300 },
    { x: 300, y: height - 250 },
    { x: width - 200, y: height / 2 },
    { x: width - 100, y: 150 },
    { x: width - 50, y: 50 },
];

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function getEnemyPosition(enemy: Enemy) {
    const current = waypoints[enemy.currentIndex];
    const next = waypoints[enemy.currentIndex + 1];
    if (!next) return current;
    return {
        x: lerp(current.x, next.x, enemy.progress),
        y: lerp(current.y, next.y, enemy.progress),
    };
}

export default function App() {
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [bullets, setBullets] = useState<Bullet[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);

    // Enemy spawn
    useEffect(() => {
        let id = 0;
        const interval = setInterval(() => {
            const rand = Math.random();
            let type: EnemyType = 'medium';
            if (rand < 0.4) type = 'fast';
            else if (rand < 0.7) type = 'medium';
            else type = 'slow';
            const hp = type === 'fast' ? 1 : type === 'medium' ? 2 : 3;

            setEnemies(prev => [
                ...prev,
                { id: id++, currentIndex: 0, progress: 0, hp, maxHp: hp, type },
            ]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Enemy hareketi
    useEffect(() => {
        const interval = setInterval(() => {
            setEnemies(prev =>
                prev
                    .map(e => {
                        let speed = e.type === 'fast' ? 0.015 : e.type === 'medium' ? 0.01 : 0.007;
                        let newProgress = e.progress + speed;
                        let newIndex = e.currentIndex;

                        if (newProgress >= 1) {
                            newIndex++;
                            newProgress = 0;
                            if (newIndex >= waypoints.length - 1) {
                                setLives(l => l - 1);
                                return null;
                            }
                        }

                        return { ...e, currentIndex: newIndex, progress: newProgress };
                    })
                    .filter(Boolean) as Enemy[]
            );
        }, 16);

        return () => clearInterval(interval);
    }, []);

    // Bullet hareketi
    useEffect(() => {
        const interval = setInterval(() => {
            setBullets(prev =>
                prev
                    .map(b => {
                        const enemy = enemies.find(e => e.id === b.targetId);
                        if (!enemy) return null;

                        const point = getEnemyPosition(enemy);
                        const dx = point.x - b.x;
                        const dy = point.y - b.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 8) {
                            setEnemies(prevEnemies =>
                                prevEnemies
                                    .map(e => (e.id === enemy.id ? { ...e, hp: e.hp - 1 } : e))
                                    .filter(e => {
                                        if (e.hp <= 0) {
                                            setScore(s => s + 1);
                                            return false;
                                        }
                                        return true;
                                    })
                            );
                            return null;
                        }

                        const speed = 8;
                        return {
                            ...b,
                            x: b.x + (dx / dist) * speed,
                            y: b.y + (dy / dist) * speed,
                        };
                    })
                    .filter(Boolean) as Bullet[]
            );
        }, 16);

        return () => clearInterval(interval);
    }, [enemies]);

    const handlePress = () => {
        if (enemies.length === 0) return;

        const towerX = waypoints[waypoints.length - 1].x;
        const towerY = waypoints[waypoints.length - 1].y;

        let target = enemies[0];
        let minDist = Number.MAX_VALUE;
        enemies.forEach(e => {
            const point = getEnemyPosition(e);
            const dist = Math.hypot(point.x - towerX, point.y - towerY);
            if (dist < minDist) {
                minDist = dist;
                target = e;
            }
        });

        const bulletColor = target.type === 'fast' ? 'orange' : target.type === 'medium' ? 'yellow' : 'lime';
        setBullets(prev => [
            ...prev,
            { x: towerX, y: towerY, targetId: target.id, color: bulletColor },
        ]);
    };

    return (
        <TouchableWithoutFeedback onPress={handlePress}>
            <View style={styles.container}>
                <Text style={styles.info}>Score: {score} | Lives: {lives}</Text>
                <View style={styles.gameArea}>
                    {/* Kule */}
                    <Image
                        source={require('./assets/tower.png')}
                        style={{ width: 50, height: 50, position: 'absolute', left: waypoints.at(-1)!.x - 25, top: waypoints.at(-1)!.y - 25 }}
                    />

                    {/* Düşmanlar */}
                    {enemies.map(e => {
                        const point = getEnemyPosition(e);
                        return (
                            <View key={e.id}>
                                <Image
                                    source={require('./assets/enemy.png')}
                                    style={{ width: 30, height: 30, position: 'absolute', left: point.x - 15, top: point.y - 15 }}
                                />
                                <View style={[styles.hpBarBackground, { left: point.x - 15, top: point.y - 25 }]} />
                                <View style={[styles.hpBar, { left: point.x - 15, top: point.y - 25, width: (30 * e.hp) / e.maxHp }]} />
                                <Text style={[styles.hpText, { left: point.x - 8, top: point.y - 37 }]}>{e.hp}</Text>
                            </View>
                        );
                    })}

                    {/* Mermiler */}
                    {bullets.map((b, i) => (
                        <View key={i} style={[styles.bullet, { left: b.x - 5, top: b.y - 5, backgroundColor: b.color }]} />
                    ))}
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1a2e', paddingTop: 50 },
    info: { color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 10 },
    gameArea: { flex: 1, backgroundColor: '#eee' },
    hpBarBackground: {
        position: 'absolute',
        height: 4,
        width: 30,
        backgroundColor: 'darkred',
        borderRadius: 2,
    },
    hpText: {
        position: 'absolute',
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    hpBar: {
        position: 'absolute',
        height: 4,
        backgroundColor: 'lime',
        borderRadius: 2,
    },
    bullet: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
});
