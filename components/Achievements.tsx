import React from 'react';
import { useFantasy, Achievement } from '../context/FantasyContext';
import { motion } from 'framer-motion';

const Achievements: React.FC = () => {
    const { achievements } = useFantasy();

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    const progress = (unlockedCount / totalCount) * 100;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        🏆 Achievements
                        <span className="text-sm font-normal text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
                            {unlockedCount}/{totalCount}
                        </span>
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Unlock badges by trading like a pro.</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700/50 rounded-full h-2 mb-6 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
            </div>
        </div>
    );
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    return (
        <div className={`relative p-4 rounded-xl border transition-all duration-300 ${achievement.unlocked
                ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-800/30 border-slate-700/50 opacity-60 grayscale'
            }`}>
            <div className="flex flex-col items-center text-center space-y-2">
                <div className={`text-3xl mb-1 ${achievement.unlocked ? 'animate-bounce-slow' : ''}`}>
                    {achievement.icon}
                </div>
                <h4 className={`font-bold text-sm ${achievement.unlocked ? 'text-white' : 'text-slate-400'}`}>
                    {achievement.title}
                </h4>
                <p className="text-xs text-slate-500 leading-tight">
                    {achievement.description}
                </p>
                {achievement.unlocked && achievement.unlockedAt && (
                    <span className="text-[10px] text-indigo-400 font-mono mt-2 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                )}
            </div>

            {achievement.unlocked && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 text-yellow-400"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                </motion.div>
            )}
        </div>
    );
};

export default Achievements;
