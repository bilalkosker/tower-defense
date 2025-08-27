import React, { useEffect, useState, useRef } from 'react';
import {View, StyleSheet, Text, Dimensions, TouchableWithoutFeedback, Image} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

type EnemyType = 'fast' | 'medium' | 'slow';

interface Enemy {
    id: number;
    length: number;
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

const pathD = `
  M50,${height - 100} 
  C150,${height - 300} 300,${height - 250} ${width - 200},${height / 2} 
  S${width - 50},150 ${width - 50},50
`;
export default function App() {
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [bullets, setBullets] = useState<Bullet[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);

    const pathRef = useRef<any>(null);
    const [pathLength, setPathLength] = useState(0);

    // Path uzunluğunu al
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (pathRef.current) {
                setPathLength(pathRef.current.getTotalLength());
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, []);

    // Düşman spawn
    useEffect(() => {
        if (!pathLength) return;
        let id = 0;
        const interval = setInterval(() => {
            const rand = Math.random();
            let type: EnemyType = 'medium';
            if (rand < 0.4) type = 'fast';
            else if (rand < 0.7) type = 'medium';
            else type = 'slow';
            const hp = type === 'fast' ? 1 : type === 'medium' ? 2 : 3;
            setEnemies(prev => [...prev, { id: id++, length: 0, hp, maxHp: hp, type }]);
        }, 2000);
        return () => clearInterval(interval);
    }, [pathLength]);

    // Enemy hareketi (yavaşlatıldı)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!pathLength) return;
            setEnemies(prev =>
                prev
                    .map(e => {
                        let speed = e.type === 'fast' ? 2 : e.type === 'medium' ? 1.5 : 1;
                        const newLength = e.length + speed;
                        if (newLength >= pathLength) {
                            setLives(l => l - 1);
                            return null;
                        }
                        return { ...e, length: newLength };
                    })
                    .filter(Boolean) as Enemy[]
            );
        }, 16);
        return () => clearInterval(interval);
    }, [pathLength]);

    // Bullet hareketi
    useEffect(() => {
        const interval = setInterval(() => {
            if (!pathLength || !pathRef.current) return;

            setBullets(prev =>
                prev
                    .map(b => {
                        const enemy = enemies.find(e => e.id === b.targetId);
                        if (!enemy) return null;

                        const point = pathRef.current.getPointAtLength(enemy.length);
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
                        return { ...b, x: b.x + (dx / dist) * speed, y: b.y + (dy / dist) * speed };
                    })
                    .filter(Boolean) as Bullet[]
            );
        }, 16);

        return () => clearInterval(interval);
    }, [enemies, pathLength]);

    const handlePress = () => {
        if (!pathLength || enemies.length === 0 || !pathRef.current) return;

        const towerX = width - 50;
        const towerY = 50;

        let target = enemies[0];
        let minDist = Number.MAX_VALUE;
        enemies.forEach(e => {
            const point = pathRef.current.getPointAtLength(e.length);
            const dist = Math.hypot(point.x - towerX, point.y - towerY);
            if (dist < minDist) {
                minDist = dist;
                target = e;
            }
        });

        const bulletColor = target.type === 'fast' ? 'orange' : target.type === 'medium' ? 'yellow' : 'lime';
        setBullets(prev => [...prev, { x: towerX, y: towerY, targetId: target.id, color: bulletColor }]);
    };

    return (
        <TouchableWithoutFeedback onPress={handlePress}>
            <View style={styles.container}>
                <Text style={styles.info}>Score: {score} | Lives: {lives}</Text>
                <View style={styles.gameArea}>
                    <Svg style={StyleSheet.absoluteFill}>
                        <Path ref={pathRef} d={pathD} stroke="#888" strokeWidth={6} fill="none" />
                    </Svg>

                    {/* Kule */}
                    <Image
                        source={require('./assets/tower.png')} // buraya kule resmi
                        style={{ width: 50, height: 50, position: 'absolute', left: width - 50 - 25, top: 50 - 25 }}
                    />

                    {/* Düşmanlar */}
                    {enemies.map(e => {
                        if (!pathLength || !pathRef.current) return null;
                        const point = pathRef.current.getPointAtLength(e.length) || { x: 0, y: 0 };

                        return (
                            <View key={e.id}>
                                {/* Düşman resmi */}
                                <Image
                                    source={require('./assets/enemy.png')} // buraya düşman resmin
                                    style={{ width: 30, height: 30, position: 'absolute', left: point.x - 15, top: point.y - 15 }}
                                />

                                {/* HP bar arka plan */}
                                <View style={[styles.hpBarBackground, { left: point.x - 15, top: point.y - 25 }]} />

                                {/* HP bar ön plan */}
                                <View style={[styles.hpBar, { left: point.x - 15, top: point.y - 25, width: (30 * e.hp) / e.maxHp }]} />

                                {/* Can sayısı */}
                                <Text style={[styles.hpText, { left: point.x - 15 + 15 - 8, top: point.y - 25 - 12 }]}>
                                    {e.hp}
                                </Text>
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
    tower: { position: 'absolute', width: 50, height: 50, backgroundColor: 'blue', borderRadius: 25 },
    enemy: { position: 'absolute', width: 30, height: 30, borderRadius: 15 },
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
