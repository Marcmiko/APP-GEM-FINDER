
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="text-center py-8 border-t border-slate-800 mt-16 pb-24 md:pb-8">
            <p className="text-sm text-slate-500 mb-2">Disclaimer: This is not financial advice. Cryptocurrency investments are highly volatile. Do your own research.</p>
            <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500 tracking-widest uppercase opacity-80">
                COOKED BY MARCMIKO
            </p>
        </footer>
    );
};

export default Footer;
